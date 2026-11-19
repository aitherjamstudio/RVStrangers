-- ========================================================
-- RVSTRANGERS D1 INITIAL SCHEMA & PRODUCTION SEED
-- ========================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,                           -- UUID v4
    google_id TEXT UNIQUE,                         -- Google 'sub' claim
    email TEXT UNIQUE,
    password_hash TEXT,
    username TEXT UNIQUE NOT NULL,                 -- Handle: lowercase alphanumeric
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    gender TEXT DEFAULT 'unspecified',
    preferred_language TEXT DEFAULT 'en',
    bio TEXT,
    is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
    is_guest INTEGER NOT NULL DEFAULT 0 CHECK (is_guest IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_google ON profiles(google_id);

-- 2. WALLET BALANCES (Current Spendable Balance)
CREATE TABLE IF NOT EXISTS wallet_balances (
    user_id TEXT PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
    diamonds INTEGER NOT NULL DEFAULT 0 CHECK (diamonds >= 0),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 3. WALLET TRANSACTIONS LEDGER (Append-Only Audit)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    currency TEXT NOT NULL CHECK (currency IN ('COINS', 'DIAMONDS')),
    amount_change INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    tx_type TEXT NOT NULL,                         -- 'STARTER_BONUS', 'REWARDED_AD', 'DECK_PURCHASE', 'IAP_DIAMONDS'
    idempotency_key TEXT UNIQUE NOT NULL,
    metadata TEXT DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tx_user_currency ON wallet_transactions(user_id, currency, created_at DESC);

-- 4. DECKS CATALOG
CREATE TABLE IF NOT EXISTS decks (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,                        -- 'deep', 'relationships', 'psychology', 'fun', 'premium', 'wellness'
    cover_image_url TEXT NOT NULL,
    access_type TEXT NOT NULL CHECK (access_type IN ('FREE', 'STANDARD', 'PREMIUM')),
    price_currency TEXT NOT NULL CHECK (price_currency IN ('NONE', 'COINS', 'DIAMONDS')),
    price_amount INTEGER NOT NULL DEFAULT 0 CHECK (price_amount >= 0),
    card_count INTEGER NOT NULL DEFAULT 0,
    plays_count INTEGER NOT NULL DEFAULT 0,
    rating REAL NOT NULL DEFAULT 4.9,
    icon TEXT DEFAULT '🎴',
    gradient TEXT DEFAULT 'from-[#5B0DAD] to-[#C026D3]',
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_decks_category ON decks(category);
CREATE INDEX IF NOT EXISTS idx_decks_access ON decks(access_type);

-- 5. CARDS (Questions per Deck)
CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    default_question TEXT NOT NULL,
    background_theme TEXT DEFAULT 'default',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(deck_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_cards_deck_order ON cards(deck_id, order_index);

-- 6. CARD TRANSLATIONS (Multilingual Support)
CREATE TABLE IF NOT EXISTS card_translations (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,                   -- 'es', 'fr', 'de', 'hi'
    translated_question TEXT NOT NULL,
    UNIQUE(card_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_translations_lookup ON card_translations(card_id, language_code);

-- 7. DECK OWNERSHIP
CREATE TABLE IF NOT EXISTS deck_ownership (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    unlock_method TEXT NOT NULL CHECK (unlock_method IN ('FREE', 'COINS', 'DIAMONDS', 'ADMIN_GRANT')),
    exploration_count INTEGER NOT NULL DEFAULT 0,
    unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, deck_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_ownership_lookup ON deck_ownership(user_id, deck_id);

-- 8. FRIENDSHIPS
CREATE TABLE IF NOT EXISTS friendships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    friend_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'ACCEPTED', 'BLOCKED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status);

-- 9. 1-ON-1 PRIVATE MESSAGES
CREATE TABLE IF NOT EXISTS private_messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0 CHECK (is_read IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON private_messages(sender_id, receiver_id, created_at DESC);

-- 10. USER REPORTS
CREATE TABLE IF NOT EXISTS user_reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES profiles(id),
    reported_user_id TEXT NOT NULL REFERENCES profiles(id),
    room_code TEXT,
    reason TEXT NOT NULL,
    evidence_text TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
