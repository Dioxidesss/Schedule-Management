"""
Isomer API – FastAPI application entry point.
"""

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.errors import APIError, ErrorCode
from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.facilities import router as facilities_router
from app.routers.appointments import router as appointments_router
from app.routers.devices import router as devices_router
from app.routers.kiosk import router as kiosk_router
from app.routers.admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing needed (Supabase client is module-level singleton)
    yield
    # Shutdown: nothing to clean up


app = FastAPI(
    title="Isomer API",
    version="1.0.0",
    description="Warehouse dock scheduling SaaS — Supabase + FastAPI backend.",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handlers
# ---------------------------------------------------------------------------


@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    """Render the error_catalog.md envelope shape for all APIError exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail,
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    """Catch-all for unexpected server errors — return internal_error."""
    request_id = str(uuid.uuid4())
    return JSONResponse(
        status_code=500,
        content={
            "code": ErrorCode.INTERNAL_ERROR.value,
            "message": "Unexpected server-side failure.",
            "request_id": request_id,
            "details": {},
        },
    )


# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(facilities_router)
app.include_router(appointments_router)
app.include_router(devices_router)
app.include_router(kiosk_router)
app.include_router(admin_router)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health", tags=["Meta"], include_in_schema=False)
async def health():
    return {"status": "ok", "version": "1.0.0"}
