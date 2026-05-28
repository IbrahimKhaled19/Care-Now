-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_requests_status_date ON requests(status, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_status_date ON transactions(status, date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role_status_deleted ON users(role, status, deleted_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_withdrawals_status_user ON withdrawals(status, user_id);
