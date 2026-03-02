-- Mostly written by admins; read by all authenticated company users for tenancy resolution.
CREATE TABLE companies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Seeded with fixed catalog rows; read-only to application users for plan gating.
CREATE TABLE plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text NOT NULL UNIQUE CHECK (code IN ('free', 'premium')),
    name text NOT NULL,
    base_price_myr_sen integer NOT NULL CHECK (
        (code = 'free' AND base_price_myr_sen = 0)
        OR (code = 'premium' AND base_price_myr_sen = 40000)
    ),
    per_truck_rate_myr_sen integer NOT NULL CHECK (
        (code = 'free' AND per_truck_rate_myr_sen = 0)
        OR (code = 'premium' AND per_truck_rate_myr_sen = 100)
    ),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Written by admins/billing workflows; read by company users for quota, cycle, and feature state.
CREATE TABLE subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id uuid NOT NULL REFERENCES plans(id),
    current_period_start timestamptz NOT NULL,
    current_period_end timestamptz NOT NULL,
    trucks_this_cycle integer NOT NULL DEFAULT 0 CHECK (trucks_this_cycle >= 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT subscriptions_period_order CHECK (current_period_end > current_period_start)
);

-- Written by company admins; read by company users to scope dashboards, kiosks, and appointments.
CREATE TABLE facilities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name text NOT NULL,
    code text NOT NULL,
    timezone text NOT NULL DEFAULT 'UTC',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (company_id, code)
);

-- Written by admins for door topology; read by manager and kiosk workflows for dock assignment.
CREATE TABLE doors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    door_code text NOT NULL,
    label text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (facility_id, door_code)
);

-- Written during auth/profile flows; read on every request for RBAC + tenancy checks.
CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    facility_id uuid REFERENCES facilities(id) ON DELETE SET NULL,
    role text NOT NULL CHECK (role IN ('admin', 'manager')),
    full_name text,
    email text NOT NULL,
    phone text,
    oauth_provider text NOT NULL CHECK (oauth_provider IN ('email', 'google')),
    oauth_token text,
    gmail_connected_email text,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT users_manager_requires_facility CHECK (
        (role = 'manager' AND facility_id IS NOT NULL)
        OR (role = 'admin')
    )
);

-- Written by admins to invite managers; read for pending invite and resend UX.
CREATE TABLE manager_invites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    invited_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name text NOT NULL,
    email text NOT NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    invite_token text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    accepted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT manager_invites_email_format CHECK (position('@' IN email) > 1)
);

-- Written by kiosk pairing and heartbeat flows; read by admins/managers for device operations.
CREATE TABLE devices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    door_id uuid REFERENCES doors(id) ON DELETE SET NULL,
    device_name text NOT NULL,
    device_model varchar(255),
    role text NOT NULL CHECK (role IN ('gatehouse', 'loading_dock')),
    device_token text UNIQUE,
    is_locked_to_facility boolean NOT NULL DEFAULT true,
    admin_pin_hash text,
    last_heartbeat_at timestamptz,
    status text NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT gatehouse_has_no_door CHECK (
        (role = 'gatehouse' AND door_id IS NULL)
        OR (role = 'loading_dock' AND door_id IS NOT NULL)
    )
);

-- Written at kiosk boot/pairing time; read/consumed by registration flow (10-minute TTL, single-use).
CREATE TABLE device_pairing_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
    code char(6) NOT NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT device_pairing_codes_format CHECK (code ~ '^[0-9]{6}$'),
    CONSTRAINT device_pairing_codes_single_use CHECK (used_at IS NULL OR used_at >= created_at)
);

-- Written by managers/gatehouse/dock workflows; read by dashboards/kiosks for live queue, timing, and AI training data.
CREATE TABLE appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    facility_id uuid NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    created_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    po_number text NOT NULL,
    carrier_name text NOT NULL,
    load_type text NOT NULL CHECK (load_type IN ('palletized', 'floor_loaded')),
    status text NOT NULL CHECK (
        status IN ('scheduled', 'yard_queue', 'assigned', 'unloading', 'completed', 'cancelled', 'no_show')
    ),
    scheduled_start timestamptz NOT NULL,
    scheduled_end timestamptz NOT NULL,
    actual_start timestamptz,
    actual_end timestamptz,
    checked_in_at timestamptz,
    door_id uuid REFERENCES doors(id) ON DELETE SET NULL,
    gate_device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
    dock_device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT appointments_sched_order CHECK (scheduled_end > scheduled_start),
    CONSTRAINT appointments_actual_order CHECK (actual_end IS NULL OR actual_start IS NOT NULL),
    CONSTRAINT appointments_actual_range CHECK (actual_end IS NULL OR actual_end >= actual_start),
    CONSTRAINT appointments_po_unique_per_facility_window UNIQUE (facility_id, po_number, scheduled_start)
);

-- Written by billing UI actions; read by admins to display current saved payment method metadata.
CREATE TABLE payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    provider text NOT NULL CHECK (provider IN ('visa', 'mastercard', 'fpx')),
    card_holder_name text,
    card_last4 char(4),
    card_expiry_month smallint CHECK (card_expiry_month BETWEEN 1 AND 12),
    card_expiry_year smallint,
    is_default boolean NOT NULL DEFAULT true,
    created_by_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT payment_methods_card_last4_digits CHECK (card_last4 IS NULL OR card_last4 ~ '^[0-9]{4}$')
);

CREATE INDEX idx_subscriptions_company_id ON subscriptions(company_id);
CREATE INDEX idx_facilities_company_id ON facilities(company_id);
CREATE INDEX idx_doors_facility_id ON doors(facility_id);
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_facility_id ON users(facility_id);
CREATE INDEX idx_manager_invites_company_status ON manager_invites(company_id, status);
CREATE INDEX idx_manager_invites_email ON manager_invites(email);
CREATE INDEX idx_devices_facility_status ON devices(facility_id, status);
CREATE INDEX idx_devices_door_id ON devices(door_id);
CREATE UNIQUE INDEX idx_device_pairing_codes_active_code ON device_pairing_codes(code)
WHERE used_at IS NULL;
CREATE INDEX idx_device_pairing_codes_facility_expires ON device_pairing_codes(facility_id, expires_at);
CREATE INDEX idx_appointments_facility_status_sched ON appointments(facility_id, status, scheduled_start);
CREATE INDEX idx_appointments_po_number ON appointments(po_number);
CREATE INDEX idx_appointments_facility_checkin ON appointments(facility_id, checked_in_at);
CREATE INDEX idx_appointments_overrun ON appointments(facility_id, scheduled_end)
WHERE actual_end IS NULL;
CREATE INDEX idx_payment_methods_company_id ON payment_methods(company_id);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE doors ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE manager_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_pairing_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY plans_read_all_authenticated
ON plans FOR SELECT
TO authenticated
USING (true);

CREATE POLICY companies_select_own
ON companies FOR SELECT
TO authenticated
USING (
    id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
);

CREATE POLICY companies_admin_update
ON companies FOR UPDATE
TO authenticated
USING (
    id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
)
WITH CHECK (
    id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

CREATE POLICY subscriptions_select_own_company
ON subscriptions FOR SELECT
TO authenticated
USING (
    company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
);

CREATE POLICY subscriptions_admin_write
ON subscriptions FOR ALL
TO authenticated
USING (
    company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
)
WITH CHECK (
    company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

CREATE POLICY facilities_select_by_company
ON facilities FOR SELECT
TO authenticated
USING (
    company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid())
);

CREATE POLICY facilities_admin_write
ON facilities FOR ALL
TO authenticated
USING (
    company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
)
WITH CHECK (
    company_id IN (SELECT u.company_id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin')
);

CREATE POLICY doors_select_scoped
ON doors FOR SELECT
TO authenticated
USING (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users u ON u.company_id = f.company_id
        WHERE u.id = auth.uid()
          AND (u.role = 'admin' OR u.facility_id = f.id)
    )
);

CREATE POLICY doors_admin_write
ON doors FOR ALL
TO authenticated
USING (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users u ON u.company_id = f.company_id
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
)
WITH CHECK (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users u ON u.company_id = f.company_id
        WHERE u.id = auth.uid() AND u.role = 'admin'
    )
);

CREATE POLICY users_select_same_company
ON users FOR SELECT
TO authenticated
USING (
    company_id IN (SELECT me.company_id FROM users me WHERE me.id = auth.uid())
);

CREATE POLICY users_update_self
ON users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

CREATE POLICY users_admin_manage_company
ON users FOR ALL
TO authenticated
USING (
    company_id IN (SELECT me.company_id FROM users me WHERE me.id = auth.uid() AND me.role = 'admin')
)
WITH CHECK (
    company_id IN (SELECT me.company_id FROM users me WHERE me.id = auth.uid() AND me.role = 'admin')
);

CREATE POLICY manager_invites_select_scoped
ON manager_invites FOR SELECT
TO authenticated
USING (
    company_id IN (SELECT me.company_id FROM users me WHERE me.id = auth.uid())
);

CREATE POLICY manager_invites_admin_write
ON manager_invites FOR ALL
TO authenticated
USING (
    company_id IN (SELECT me.company_id FROM users me WHERE me.id = auth.uid() AND me.role = 'admin')
)
WITH CHECK (
    company_id IN (SELECT me.company_id FROM users me WHERE me.id = auth.uid() AND me.role = 'admin')
);

CREATE POLICY devices_select_scoped
ON devices FOR SELECT
TO authenticated
USING (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users me ON me.company_id = f.company_id
        WHERE me.id = auth.uid()
          AND (me.role = 'admin' OR me.facility_id = f.id)
    )
);

CREATE POLICY devices_scoped_write
ON devices FOR ALL
TO authenticated
USING (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users me ON me.company_id = f.company_id
        WHERE me.id = auth.uid()
          AND (me.role = 'admin' OR me.facility_id = f.id)
    )
)
WITH CHECK (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users me ON me.company_id = f.company_id
        WHERE me.id = auth.uid()
          AND (me.role = 'admin' OR me.facility_id = f.id)
    )
);

CREATE POLICY device_pairing_codes_select_scoped
ON device_pairing_codes FOR SELECT
TO authenticated
USING (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users me ON me.company_id = f.company_id
        WHERE me.id = auth.uid()
          AND (me.role = 'admin' OR me.facility_id = f.id)
    )
);

CREATE POLICY device_pairing_codes_write_scoped
ON device_pairing_codes FOR ALL
TO authenticated
USING (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users me ON me.company_id = f.company_id
        WHERE me.id = auth.uid()
          AND (me.role = 'admin' OR me.facility_id = f.id)
    )
)
WITH CHECK (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users me ON me.company_id = f.company_id
        WHERE me.id = auth.uid()
          AND (me.role = 'admin' OR me.facility_id = f.id)
    )
);

CREATE POLICY appointments_select_scoped
ON appointments FOR SELECT
TO authenticated
USING (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users me ON me.company_id = f.company_id
        WHERE me.id = auth.uid()
          AND (me.role = 'admin' OR me.facility_id = f.id)
    )
);

CREATE POLICY appointments_write_scoped
ON appointments FOR ALL
TO authenticated
USING (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users me ON me.company_id = f.company_id
        WHERE me.id = auth.uid()
          AND (me.role = 'admin' OR me.facility_id = f.id)
    )
)
WITH CHECK (
    facility_id IN (
        SELECT f.id
        FROM facilities f
        JOIN users me ON me.company_id = f.company_id
        WHERE me.id = auth.uid()
          AND (me.role = 'admin' OR me.facility_id = f.id)
    )
);

CREATE POLICY payment_methods_select_own_company
ON payment_methods FOR SELECT
TO authenticated
USING (
    company_id IN (SELECT me.company_id FROM users me WHERE me.id = auth.uid())
);

CREATE POLICY payment_methods_admin_write
ON payment_methods FOR ALL
TO authenticated
USING (
    company_id IN (SELECT me.company_id FROM users me WHERE me.id = auth.uid() AND me.role = 'admin')
)
WITH CHECK (
    company_id IN (SELECT me.company_id FROM users me WHERE me.id = auth.uid() AND me.role = 'admin')
);
