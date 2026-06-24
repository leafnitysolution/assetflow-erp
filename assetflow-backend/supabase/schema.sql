-- ============================================================
-- AssetFlow ERP — Supabase PostgreSQL Schema
-- Run this in Supabase SQL Editor to initialize all tables.
-- ============================================================

-- ── Enums ────────────────────────────────────────────────────
CREATE TYPE user_role   AS ENUM ('super-admin', 'admin', 'member');
CREATE TYPE user_status AS ENUM ('active', 'inactive');

CREATE TYPE asset_category      AS ENUM ('electronics', 'furniture', 'vehicle', 'equipment', 'tools', 'other');
CREATE TYPE asset_status        AS ENUM ('available', 'assigned', 'maintenance', 'retired', 'lost', 'damaged');
CREATE TYPE asset_condition     AS ENUM ('excellent', 'good', 'fair', 'poor');
CREATE TYPE purchase_status     AS ENUM ('new', 'refurbished');

CREATE TYPE asset_history_event AS ENUM ('ASSIGNED', 'RETURNED', 'REPAIR', 'STATUS_CHANGE', 'CREATED');

CREATE TYPE ticket_type     AS ENUM ('issue', 'maintenance', 'replacement', 'damage', 'lost');
CREATE TYPE ticket_status   AS ENUM ('open', 'assigned', 'in-progress', 'pending-approval', 'on-hold', 'resolved', 'closed', 'reopened');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_source   AS ENUM ('manual', 'email');

CREATE TYPE vendor_status AS ENUM ('active', 'inactive');

CREATE TYPE log_action      AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'ASSIGN', 'RETURN', 'RESOLVE', 'LOGIN', 'LOGIN_FAIL', 'LOGOUT', 'COMMENT');
CREATE TYPE log_entity_type AS ENUM ('asset', 'ticket', 'user', 'vendor', 'auth');

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  role          user_role   NOT NULL,
  department    TEXT,
  branch        TEXT,
  avatar        TEXT,
  phone         TEXT,
  status        user_status NOT NULL DEFAULT 'active',
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users (email);
CREATE INDEX idx_users_status ON users (status);

-- ── Vendors ──────────────────────────────────────────────────
CREATE TABLE vendors (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT          NOT NULL,
  email          TEXT,
  phone          TEXT,
  address        TEXT,
  contact_person TEXT,
  website        TEXT,
  rating         NUMERIC(3,1),
  total_orders   INTEGER       NOT NULL DEFAULT 0,
  status         vendor_status NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vendors_name ON vendors (name);

-- ── Assets ───────────────────────────────────────────────────
CREATE TABLE assets (
  id                UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT             NOT NULL,
  description       TEXT,
  category          asset_category   NOT NULL,
  status            asset_status     NOT NULL DEFAULT 'available',
  serial_number     TEXT,
  sku               TEXT,
  barcode           TEXT,
  qr_code           TEXT,
  purchase_date     DATE,
  purchase_price    NUMERIC(12,2),
  purchase_status   purchase_status  NOT NULL DEFAULT 'new',
  vendor_id         UUID             REFERENCES vendors(id) ON DELETE SET NULL,
  vendor_name       TEXT,
  warranty_expiry   DATE,
  insurance_expiry  DATE,
  amc_expiry        DATE,
  branch            TEXT,
  location          TEXT,
  department_id     TEXT,
  assigned_to       UUID             REFERENCES users(id) ON DELETE SET NULL,
  assigned_at       TIMESTAMPTZ,
  condition         asset_condition  NOT NULL DEFAULT 'good',
  depreciation_rate NUMERIC(5,2),
  current_value     NUMERIC(12,2),
  sub_type          TEXT,
  specs             JSONB            DEFAULT '{}',
  created_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assets_status      ON assets (status);
CREATE INDEX idx_assets_category    ON assets (category);
CREATE INDEX idx_assets_assigned_to ON assets (assigned_to);
CREATE INDEX idx_assets_branch      ON assets (branch);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Asset History ────────────────────────────────────────────
CREATE TABLE asset_history (
  id             UUID                 PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id       UUID                 NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  asset_name     TEXT,
  event          asset_history_event  NOT NULL,
  user_id        UUID                 REFERENCES users(id) ON DELETE SET NULL,
  user_name      TEXT,
  user_email     TEXT,
  from_status    TEXT,
  to_status      TEXT,
  repair_details JSONB,
  performed_by   TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_asset_history_asset_id ON asset_history (asset_id, created_at DESC);
CREATE INDEX idx_asset_history_user_id  ON asset_history (user_id);

-- ── Tickets ──────────────────────────────────────────────────
CREATE TABLE tickets (
  id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number    TEXT            UNIQUE,
  title            TEXT            NOT NULL,
  description      TEXT            NOT NULL,
  type             ticket_type     NOT NULL,
  status           ticket_status   NOT NULL DEFAULT 'open',
  priority         ticket_priority NOT NULL DEFAULT 'medium',
  asset_id         UUID            REFERENCES assets(id) ON DELETE SET NULL,
  asset_name       TEXT,
  source           ticket_source   NOT NULL DEFAULT 'manual',
  raw_email        TEXT,
  created_by       UUID            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by_name  TEXT,
  assigned_to      UUID            REFERENCES users(id) ON DELETE SET NULL,
  assigned_to_name TEXT,
  department_id    TEXT,
  attachments      TEXT[]          DEFAULT '{}',
  sla              INTEGER,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_status      ON tickets (status);
CREATE INDEX idx_tickets_created_by  ON tickets (created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets (assigned_to);

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Ticket Comments ──────────────────────────────────────────
CREATE TABLE ticket_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  user_name  TEXT,
  content    TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments (ticket_id, created_at ASC);

-- ── Audit Logs ───────────────────────────────────────────────
CREATE TABLE audit_logs (
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID            REFERENCES users(id) ON DELETE SET NULL,
  user_name   TEXT            NOT NULL,
  user_role   TEXT            NOT NULL,
  action      log_action      NOT NULL,
  entity_type log_entity_type NOT NULL,
  entity_id   TEXT,
  entity_name TEXT,
  details     TEXT,
  ip_address  TEXT,
  created_at  TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_action      ON audit_logs (action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs (entity_type);
CREATE INDEX idx_audit_logs_user_id     ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_created_at  ON audit_logs (created_at DESC);
