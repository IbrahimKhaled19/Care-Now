-- Care Now Hardening Migration
-- Run: node src/db/migrate.js (applied automatically by migration runner)
-- This migration adds soft-delete support, audit logging, and performance indexes.

-- ============================================================
-- Soft-Delete Columns
-- ============================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE providers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- ============================================================
-- Audit Log Table
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- ============================================================
-- Performance Indexes
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_requests_date ON requests(date);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_provider ON transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_transactions_patient ON transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_providers_rating ON providers(rating DESC);

-- ============================================================
-- Foreign Key Safety (soft-delete makes hard deletes rare,
-- but these constraints prevent FK violations if it happens)
-- ============================================================

-- requests.patient_id
DO $$
BEGIN
  ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_patient_id_fkey;
  ALTER TABLE requests ADD CONSTRAINT requests_patient_id_fkey
    FOREIGN KEY (patient_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- requests.provider_id
DO $$
BEGIN
  ALTER TABLE requests DROP CONSTRAINT IF EXISTS requests_provider_id_fkey;
  ALTER TABLE requests ADD CONSTRAINT requests_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
