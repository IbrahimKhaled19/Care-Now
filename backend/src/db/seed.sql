-- Care Now Seed Data
-- Run: node src/db/seed.js
-- Uses ON CONFLICT DO NOTHING to be safely re-runnable.

-- ============================================================
-- Users: Admins
-- ============================================================
INSERT INTO users (id, clerk_user_id, email, full_name, role, status, account_number, created_at) VALUES
('a0000000-0000-0000-0000-000000000001', 'clerk_admin_1', 'admin@carenow.com', 'Admin User', 'admin', 'active', 'ACC001', '2023-01-15'),
('a0000000-0000-0000-0000-000000000002', 'clerk_mod_1', 'mod@carenow.com', 'Tomas Frank', 'moderator', 'active', 'ACC002', '2023-01-15'),
('a0000000-0000-0000-0000-000000000003', 'clerk_mod_2', 'mod2@carenow.com', 'Sarah Adams', 'moderator', 'suspended', 'ACC003', '2023-01-15')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Users: Providers
-- ============================================================
INSERT INTO users (id, clerk_user_id, email, full_name, role, status, created_at) VALUES
('b0000000-0000-0000-0000-000000000001', 'clerk_provider_1', 'dr.john@carenow.com', 'Dr. John Doe', 'provider', 'active', '2023-01-10'),
('b0000000-0000-0000-0000-000000000002', 'clerk_provider_2', 'sara.a@carenow.com', 'Sara Ali', 'provider', 'active', '2023-02-15'),
('b0000000-0000-0000-0000-000000000003', 'clerk_provider_3', 'dr.robert@carenow.com', 'Dr. Robert Smith', 'provider', 'active', '2023-01-05'),
('b0000000-0000-0000-0000-000000000004', 'clerk_provider_4', 'dr.sarah@carenow.com', 'Dr. Sarah Wilson', 'provider', 'active', '2023-01-08'),
('b0000000-0000-0000-0000-000000000005', 'clerk_provider_5', 'dr.lisa@carenow.com', 'Dr. Lisa Brown', 'provider', 'active', '2023-01-12')
ON CONFLICT (id) DO NOTHING;

INSERT INTO providers (id, specialty, visits, credentials, accept_rate, rating) VALUES
('b0000000-0000-0000-0000-000000000001', 'Nurse', 450, NULL, NULL, 4.8),
('b0000000-0000-0000-0000-000000000002', 'Nurse', 450, 'RN', '95%', 4.8),
('b0000000-0000-0000-0000-000000000003', 'Home Health Aide', 320, 'CNA', '92%', 4.9),
('b0000000-0000-0000-0000-000000000004', 'Physical Therapy', 280, 'DPT', '88%', 4.7),
('b0000000-0000-0000-0000-000000000005', 'Nursing Care', 390, 'RN, BSN', '90%', 4.6)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Users: Patients
-- ============================================================
INSERT INTO users (id, clerk_user_id, email, full_name, role, status, created_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'clerk_patient_1', 'liam.h@example.com', 'Liam Harper', 'patient', 'active', '2023-01-15'),
('c0000000-0000-0000-0000-000000000002', 'clerk_patient_2', 'emma.w@example.com', 'Emma Wilson', 'patient', 'suspended', '2023-02-20'),
('c0000000-0000-0000-0000-000000000003', 'clerk_patient_3', 'james.c@example.com', 'James Chen', 'patient', 'active', '2023-03-10'),
('c0000000-0000-0000-0000-000000000004', 'clerk_patient_4', 'sofia.r@example.com', 'Sofia Rodriguez', 'patient', 'active', '2023-04-05'),
('c0000000-0000-0000-0000-000000000005', 'clerk_patient_5', 'emily.c@example.com', 'Emily Carter', 'patient', 'active', '2023-01-10')
ON CONFLICT (id) DO NOTHING;

INSERT INTO patients (id, location, avatar, date_joined) VALUES
('c0000000-0000-0000-0000-000000000001', 'New York, NY', 'https://randomuser.me/api/portraits/men/32.jpg', '2023-01-15'),
('c0000000-0000-0000-0000-000000000002', 'Los Angeles, CA', 'https://randomuser.me/api/portraits/women/44.jpg', '2023-02-20'),
('c0000000-0000-0000-0000-000000000003', 'Chicago, IL', 'https://randomuser.me/api/portraits/men/45.jpg', '2023-03-10'),
('c0000000-0000-0000-0000-000000000004', 'Houston, TX', 'https://randomuser.me/api/portraits/women/65.jpg', '2023-04-05'),
('c0000000-0000-0000-0000-000000000005', 'New York, NY', 'https://randomuser.me/api/portraits/women/32.jpg', '2023-01-10')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Requests (ON CONFLICT on id for SERIAL)
-- ============================================================
INSERT INTO requests (id, patient_id, provider_id, service, status, date) VALUES
(12345, 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Home Health Aide', 'waiting', '2023-01-15'),
(12346, 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Physical Therapy', 'in_progress', '2023-01-14'),
(12347, 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'Nursing Care', 'completed', '2023-01-13'),
(12348, 'c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000005', 'Home Health Aide', 'canceled', '2023-01-12'),
(12349, 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Home Health Aide', 'waiting', '2023-01-11'),
(12350, 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'Physical Therapy', 'in_progress', '2023-01-10'),
(12351, 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000005', 'Nursing Care', 'completed', '2023-01-09')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Transactions
-- ============================================================
INSERT INTO transactions (id, patient_id, provider_id, service, amount, status, date) VALUES
('TXN12345', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Home Health Aide', 150.00, 'completed', '2023-01-15'),
('TXN12346', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Home Health Aide', 75.00, 'completed', '2023-01-15'),
('TXN12347', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Home Health Aide', 150.00, 'pending', '2023-01-15'),
('TXN12348', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Home Health Aide', 150.00, 'canceled', '2023-01-15'),
('TXN12349', 'c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000003', 'Home Health Aide', 75.00, 'completed', '2023-01-15')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Withdrawals
-- ============================================================
INSERT INTO withdrawals (id, user_id, amount, status, method, requested_date, processed_date) VALUES
('W12345', 'b0000000-0000-0000-0000-000000000003', 150.00, 'completed', 'E-Wallet', '2025-10-20', '2025-10-21'),
('W12346', 'b0000000-0000-0000-0000-000000000004', 550.00, 'failed', 'Bank', '2025-10-20', '2025-10-21'),
('W12347', 'b0000000-0000-0000-0000-000000000003', 90.00, 'completed', 'E-Wallet', '2025-10-20', '2025-10-21'),
('W12348', 'b0000000-0000-0000-0000-000000000003', 180.00, 'pending', 'E-Wallet', '2025-10-20', '2025-10-21'),
('W12349', 'b0000000-0000-0000-0000-000000000005', 50.00, 'completed', 'E-Wallet', '2025-10-20', '2025-10-21')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- Wallets
-- ============================================================
INSERT INTO wallets (id, user_id, balance, on_hold, earnings, last_transaction_date, type, status) VALUES
('WAL001', 'c0000000-0000-0000-0000-000000000005', 251.00, 78.00, 0, '2025-10-20', 'payment', 'on_hold'),
('WAL002', 'b0000000-0000-0000-0000-000000000003', 223.00, 0, 70.00, '2025-10-20', 'withdraw', 'active'),
('WAL003', 'c0000000-0000-0000-0000-000000000001', 213.00, 78.00, 0, '2025-10-20', 'payment', 'on_hold'),
('WAL004', 'c0000000-0000-0000-0000-000000000003', 293.00, 78.00, 0, '2025-10-20', 'withdraw', 'pending'),
('WAL005', 'c0000000-0000-0000-0000-000000000004', 264.00, 0, 78.00, '2025-10-20', 'withdraw', 'frozen')
ON CONFLICT (id) DO NOTHING;

-- Reset sequences to safe values
SELECT setval('requests_id_seq', COALESCE((SELECT MAX(id) FROM requests), 1));
