-- Migration 0003: Auth Exchange Codes for Centralized Hosted OAuth Portal
CREATE TABLE IF NOT EXISTS auth_exchange_codes (
    code TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    user_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_exchange_codes_exp ON auth_exchange_codes(expires_at);
