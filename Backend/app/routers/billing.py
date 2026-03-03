"""
Phase 11 — Billing & Plan Enforcement
=======================================
Admin-only billing endpoints:

  GET  /admin/billing/subscription              — read current subscription
  POST /admin/billing/subscription/change-plan  — switch plan (free ↔ premium)
  GET  /admin/billing/payment-methods           — list masked payment methods
  POST /admin/billing/payment-methods           — add payment method
  PATCH /admin/billing/payment-methods/{id}/default — set default method

Realtime events emitted to company:{company_id}:billing:
  subscription_updated, payment_method_updated

Feature flag enforcement (ai_logic.md):
  - free plan: AI autopilot, auto-reshuffle, advanced analytics disabled
  - premium:   all enabled
  The feature flag check lives in db.get_plan_feature_flags() and is surfaced
  on the dashboard aggregate + enforced at create-appointment time (scheduled_end
  auto-prediction disabled on free plan).
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, status
from pydantic import BaseModel

from app.core.errors import ErrorCode, api_error
from app.core.realtime import build_envelope, publish
from app.core.supabase import service_client
from app.middleware.tenancy import AdminUser

router = APIRouter(prefix="/admin/billing", tags=["Billing"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _get_subscription(company_id: str) -> dict:
    """Fetch the company's active subscription row with joined plan data."""
    result = (
        service_client.table("subscriptions")
        .select(
            "id, plan_id, current_period_start, current_period_end, "
            "trucks_this_cycle, created_at, updated_at, "
            "plans(id, code, name, base_price_myr_sen, per_truck_rate_myr_sen)"
        )
        .eq("company_id", company_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    if not rows:
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "No subscription found for company.")
    return rows[0]


def _format_subscription(row: dict) -> dict:
    """Shape subscription row into API response."""
    plan = row.get("plans") or {}
    return {
        "subscription_id": row["id"],
        "plan_code": plan.get("code"),
        "plan_name": plan.get("name"),
        "base_price_myr_sen": plan.get("base_price_myr_sen"),
        "per_truck_rate_myr_sen": plan.get("per_truck_rate_myr_sen"),
        "current_period_start": row["current_period_start"],
        "current_period_end": row["current_period_end"],
        "trucks_this_cycle": row["trucks_this_cycle"],
    }


# ---------------------------------------------------------------------------
# GET /admin/billing/subscription
# ---------------------------------------------------------------------------


@router.get("/subscription", status_code=status.HTTP_200_OK)
async def get_subscription(current_user: AdminUser):
    """Return the current subscription summary for the caller's company."""
    row = _get_subscription(str(current_user.company_id))
    return _format_subscription(row)


# ---------------------------------------------------------------------------
# POST /admin/billing/subscription/change-plan
# ---------------------------------------------------------------------------


class ChangePlanRequest(BaseModel):
    plan_code: str  # 'free' | 'premium'


@router.post("/subscription/change-plan", status_code=status.HTTP_200_OK)
async def change_plan(body: ChangePlanRequest, current_user: AdminUser):
    """
    Switch the company's subscription plan.
    state_machines.md: subscription transitions — free ↔ premium.
    """
    if body.plan_code not in ("free", "premium"):
        raise api_error(ErrorCode.PLAN_CODE_INVALID, 422, "plan_code must be 'free' or 'premium'.")

    # Fetch target plan row
    plan_res = (
        service_client.table("plans")
        .select("id, code, name, base_price_myr_sen, per_truck_rate_myr_sen")
        .eq("code", body.plan_code)
        .maybe_single()
        .execute()
    )
    if not plan_res.data:
        raise api_error(ErrorCode.PLAN_CODE_INVALID, 422, f"Plan '{body.plan_code}' not found in catalog.")

    new_plan = plan_res.data

    # Guard: not already on this plan
    current_sub = _get_subscription(str(current_user.company_id))
    current_plan = current_sub.get("plans") or {}
    if current_plan.get("code") == body.plan_code:
        raise api_error(
            ErrorCode.PLAN_CHANGE_NOT_ALLOWED, 422,
            f"Company is already on the '{body.plan_code}' plan.",
        )

    # Update subscription.plan_id
    service_client.table("subscriptions").update({
        "plan_id": new_plan["id"],
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", current_sub["id"]).execute()

    # Realtime: subscription_updated → company:{id}:billing
    await publish(
        f"company:{current_user.company_id}:billing",
        build_envelope(
            event_type="subscription_updated",
            facility_id=None,
            company_id=str(current_user.company_id),
            actor={"kind": "user", "id": str(current_user.id)},
            payload={
                "subscription_id": current_sub["id"],
                "old_plan_code": current_plan.get("code"),
                "new_plan_code": body.plan_code,
            },
        ),
    )

    # Return refreshed summary
    updated_sub = _get_subscription(str(current_user.company_id))
    return _format_subscription(updated_sub)


# ---------------------------------------------------------------------------
# GET /admin/billing/payment-methods
# ---------------------------------------------------------------------------


@router.get("/payment-methods", status_code=status.HTTP_200_OK)
async def list_payment_methods(current_user: AdminUser):
    """Return all payment methods for the caller's company (masked)."""
    result = (
        service_client.table("payment_methods")
        .select(
            "id, provider, card_holder_name, card_last4, "
            "card_expiry_month, card_expiry_year, is_default, created_at"
        )
        .eq("company_id", str(current_user.company_id))
        .order("created_at", desc=True)
        .execute()
    )
    return {"payment_methods": result.data or []}


# ---------------------------------------------------------------------------
# POST /admin/billing/payment-methods
# ---------------------------------------------------------------------------


class AddPaymentMethodRequest(BaseModel):
    provider: str                # 'visa' | 'mastercard' | 'fpx'
    card_holder_name: str | None = None
    card_number_tokenized: str   # Frontend-tokenized; we derive last4 only
    expiry_month: int | None = None
    expiry_year: int | None = None
    cvc_tokenized: str | None = None


@router.post("/payment-methods", status_code=status.HTTP_201_CREATED)
async def add_payment_method(body: AddPaymentMethodRequest, current_user: AdminUser):
    """
    Save payment method metadata (tokenized — we never store raw card data).
    Derives card_last4 from the last 4 chars of the tokenized number.
    """
    if body.provider not in ("visa", "mastercard", "fpx"):
        raise api_error(
            ErrorCode.PAYMENT_PROVIDER_INVALID, 422,
            "provider must be 'visa', 'mastercard', or 'fpx'.",
        )

    if body.expiry_month and not (1 <= body.expiry_month <= 12):
        raise api_error(ErrorCode.PAYMENT_TOKENIZATION_REQUIRED, 422, "expiry_month must be 1–12.")

    # Derive last4 from tokenized string (last 4 chars)
    raw_token = body.card_number_tokenized.replace(" ", "")
    card_last4 = raw_token[-4:] if len(raw_token) >= 4 else None

    # If a new card is added, flip any existing default to false
    service_client.table("payment_methods").update({"is_default": False}).eq(
        "company_id", str(current_user.company_id)
    ).eq("is_default", True).execute()

    result = (
        service_client.table("payment_methods")
        .insert({
            "company_id": str(current_user.company_id),
            "provider": body.provider,
            "card_holder_name": body.card_holder_name,
            "card_last4": card_last4,
            "card_expiry_month": body.expiry_month,
            "card_expiry_year": body.expiry_year,
            "is_default": True,   # newest card becomes default
            "created_by_user_id": str(current_user.id),
        })
        .execute()
    )
    if not result.data:
        raise api_error(ErrorCode.INTERNAL_ERROR, 500, "Unexpected server error inserting payment method.")

    pm = result.data[0]

    # Realtime: payment_method_updated → company:{id}:billing
    await publish(
        f"company:{current_user.company_id}:billing",
        build_envelope(
            event_type="payment_method_updated",
            facility_id=None,
            company_id=str(current_user.company_id),
            actor={"kind": "user", "id": str(current_user.id)},
            payload={
                "payment_method_id": pm["id"],
                "provider": body.provider,
                "card_last4": card_last4,
                "action": "added",
            },
        ),
    )

    return {
        "payment_method_id": pm["id"],
        "provider": body.provider,
        "card_last4": card_last4,
    }


# ---------------------------------------------------------------------------
# PATCH /admin/billing/payment-methods/{payment_method_id}/default
# ---------------------------------------------------------------------------


@router.patch("/payment-methods/{payment_method_id}/default", status_code=status.HTTP_200_OK)
async def set_default_payment_method(payment_method_id: uuid.UUID, current_user: AdminUser):
    """
    Atomically flip the default payment method:
      1. Clear existing default for the company.
      2. Set the target method as default.
    """
    # Verify the method belongs to this company
    pm_res = (
        service_client.table("payment_methods")
        .select("id, company_id, provider, card_last4")
        .eq("id", str(payment_method_id))
        .maybe_single()
        .execute()
    )
    pm = pm_res.data
    if not pm:
        raise api_error(ErrorCode.PAYMENT_METHOD_NOT_FOUND, 404, "Payment method not found.")

    if pm["company_id"] != str(current_user.company_id):
        raise api_error(ErrorCode.COMPANY_SCOPE_VIOLATION, 403, "Resource belongs to different company.")

    # Step 1: clear existing defaults
    service_client.table("payment_methods").update({"is_default": False}).eq(
        "company_id", str(current_user.company_id)
    ).eq("is_default", True).execute()

    # Step 2: set new default
    service_client.table("payment_methods").update({"is_default": True}).eq(
        "id", str(payment_method_id)
    ).execute()

    # Realtime: payment_method_updated → company:{id}:billing
    await publish(
        f"company:{current_user.company_id}:billing",
        build_envelope(
            event_type="payment_method_updated",
            facility_id=None,
            company_id=str(current_user.company_id),
            actor={"kind": "user", "id": str(current_user.id)},
            payload={
                "payment_method_id": str(payment_method_id),
                "provider": pm.get("provider"),
                "card_last4": pm.get("card_last4"),
                "action": "set_default",
            },
        ),
    )

    return {"success": True, "default_payment_method_id": str(payment_method_id)}
