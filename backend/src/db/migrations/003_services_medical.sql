-- Services & Medical Info tables
-- Run: node src/db/migrate.js

-- Provider services
CREATE TABLE IF NOT EXISTS provider_services (
  id SERIAL PRIMARY KEY,
  provider_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient medical info
CREATE TABLE IF NOT EXISTS patient_medical (
  id SERIAL PRIMARY KEY,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  items TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_patient_medical_patient ON patient_medical(patient_id);

-- Seed: provider services
INSERT INTO provider_services (provider_id, name, description) VALUES
('b0000000-0000-0000-0000-000000000001', 'General Care', 'Basic health support & monitoring'),
('b0000000-0000-0000-0000-000000000001', 'Elderly Care', 'Assistance with elderly patients'),
('b0000000-0000-0000-0000-000000000001', 'Child Care', 'Specialized care for children'),
('b0000000-0000-0000-0000-000000000002', 'General Care', 'Basic health support & monitoring'),
('b0000000-0000-0000-0000-000000000002', 'Elderly Care', 'Assistance with elderly patients'),
('b0000000-0000-0000-0000-000000000003', 'Home Health Aide', 'In-home personal care assistance'),
('b0000000-0000-0000-0000-000000000003', 'Child Care', 'Specialized care for children'),
('b0000000-0000-0000-0000-000000000004', 'Physical Therapy', 'Rehabilitation and mobility exercises'),
('b0000000-0000-0000-0000-000000000004', 'Post-Injury Rehab', 'Recovery support after injuries'),
('b0000000-0000-0000-0000-000000000005', 'Nursing Care', 'Professional nursing services'),
('b0000000-0000-0000-0000-000000000005', 'General Care', 'Basic health support & monitoring');

-- Seed: patient medical info
INSERT INTO patient_medical (patient_id, category, items) VALUES
('c0000000-0000-0000-0000-000000000001', 'Chronic Conditions', ARRAY['Asthma', 'Hypertension']),
('c0000000-0000-0000-0000-000000000001', 'Current Medications', ARRAY['Albuterol', 'Lisinopril']),
('c0000000-0000-0000-0000-000000000001', 'Allergies', ARRAY['Penicillin']),
('c0000000-0000-0000-0000-000000000001', 'Disabilities', ARRAY['None']),
('c0000000-0000-0000-0000-000000000002', 'Chronic Conditions', ARRAY['Diabetes Type 2']),
('c0000000-0000-0000-0000-000000000002', 'Current Medications', ARRAY['Metformin']),
('c0000000-0000-0000-0000-000000000002', 'Allergies', ARRAY['None']),
('c0000000-0000-0000-0000-000000000002', 'Disabilities', ARRAY['None']),
('c0000000-0000-0000-0000-000000000003', 'Chronic Conditions', ARRAY['None']),
('c0000000-0000-0000-0000-000000000003', 'Current Medications', ARRAY['Ibuprofen (as needed)']),
('c0000000-0000-0000-0000-000000000003', 'Allergies', ARRAY['Sulfa drugs']),
('c0000000-0000-0000-0000-000000000003', 'Disabilities', ARRAY['None']),
('c0000000-0000-0000-0000-000000000004', 'Chronic Conditions', ARRAY['Arthritis']),
('c0000000-0000-0000-0000-000000000004', 'Current Medications', ARRAY['Naproxen', 'Vitamin D']),
('c0000000-0000-0000-0000-000000000004', 'Allergies', ARRAY['Latex']),
('c0000000-0000-0000-0000-000000000004', 'Disabilities', ARRAY['Limited mobility (left knee)']),
('c0000000-0000-0000-0000-000000000005', 'Chronic Conditions', ARRAY['Asthma']),
('c0000000-0000-0000-0000-000000000005', 'Current Medications', ARRAY['Albuterol inhaler']),
('c0000000-0000-0000-0000-000000000005', 'Allergies', ARRAY['Penicillin', 'Shellfish']),
('c0000000-0000-0000-0000-000000000005', 'Disabilities', ARRAY['None']);
