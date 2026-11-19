-- ========================================================
-- RVSTRANGERS-MESSAGES D1 DATABASE SCHEMA
-- Database: rvstrangers-messages
-- ========================================================

-- 1-ON-1 PRIVATE MESSAGES
CREATE TABLE IF NOT EXISTS private_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    receiver_id TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON private_messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON private_messages(receiver_id, is_read);

