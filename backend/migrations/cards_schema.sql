-- ========================================================
-- RVSTRANGERS-CARDS D1 DATABASE SCHEMA & SEED DATA
-- Database: rvstrangers-cards
-- ========================================================

-- 1. DECKS CATALOG
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

-- 2. CARDS (Questions per Deck)
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

-- 3. CARD TRANSLATIONS (Multilingual Support)
CREATE TABLE IF NOT EXISTS card_translations (
    id TEXT PRIMARY KEY,
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    language_code TEXT NOT NULL,                   -- 'es', 'fr', 'de', 'hi'
    translated_question TEXT NOT NULL,
    UNIQUE(card_id, language_code)
);

CREATE INDEX IF NOT EXISTS idx_translations_lookup ON card_translations(card_id, language_code);

-- 4. DECK OWNERSHIP
CREATE TABLE IF NOT EXISTS deck_ownership (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    deck_id TEXT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    unlock_method TEXT NOT NULL CHECK (unlock_method IN ('FREE', 'COINS', 'DIAMONDS', 'ADMIN_GRANT')),
    exploration_count INTEGER NOT NULL DEFAULT 0,
    unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_id, deck_id)
);

CREATE INDEX IF NOT EXISTS idx_deck_ownership_lookup ON deck_ownership(user_id, deck_id);

-- SEED DECKS
INSERT OR IGNORE INTO decks (id, slug, title, description, category, cover_image_url, access_type, price_currency, price_amount, card_count, plays_count, rating, icon, gradient) VALUES
('deck_deep', 'deep-conversations', 'Deep Conversations', 'Meaningful prompts on values, dreams, vulnerable truths, and core memories.', 'deep', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600', 'FREE', 'NONE', 0, 30, 128400, 4.95, '🌅', 'from-[#330F47] to-[#5C1663]'),
('deck_relationships', 'relationships', 'Relationships', 'Heartfelt questions exploring romantic connections, trust, and intimacy.', 'relationships', 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600', 'FREE', 'NONE', 0, 35, 98200, 4.88, '💖', 'from-[#4A0E47] to-[#7D1B77]'),
('deck_mind', 'mind-psychology', 'Mind & Psychology', 'Intriguing questions about thought patterns, cognitive habits, and perception.', 'psychology', 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=600', 'FREE', 'NONE', 0, 30, 76500, 4.82, '🧠', 'from-[#2F144D] to-[#4B1E78]'),
('deck_friends', 'friends-fun', 'Friends & Fun', 'Hilarious, engaging questions that break the ice and create lasting inside jokes.', 'fun', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=600', 'FREE', 'NONE', 0, 25, 62100, 4.91, '🎉', 'from-[#4F2B14] to-[#7A4520]'),
('deck_self_discovery', 'self-discovery', 'Self Discovery', 'Introspective prompts exploring personal boundaries, self-worth, and life purpose.', 'premium', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600', 'PREMIUM', 'DIAMONDS', 20, 40, 45200, 4.98, '🧗', 'from-[#3A144F] to-[#5B0DAD]'),
('deck_couples_talk', 'couples-talk', 'Couples Talk', 'Spicy, tender, and honest prompts designed to deepen your romantic bond.', 'premium', 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600', 'PREMIUM', 'DIAMONDS', 25, 50, 52900, 4.97, '💑', 'from-[#54113D] to-[#8C1D66]'),
('deck_life_goals', 'life-goals', 'Life Goals', 'Visionary discussions on ambition, legacy, and what true success feels like.', 'premium', 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600', 'PREMIUM', 'DIAMONDS', 20, 30, 38100, 4.89, '🚩', 'from-[#422209] to-[#804212]'),
('deck_emotional', 'emotional-wellness', 'Emotional Wellness', 'Gentle, grounding questions for processing feelings, stress, and empathy.', 'premium', 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600', 'PREMIUM', 'DIAMONDS', 20, 35, 41000, 4.93, '🪷', 'from-[#1B3632] to-[#2E5E57]'),
('deck_what_if', 'what-if', 'What If? Scenarios', 'Wild hypothetical quandaries, moral dilemmas, and alternate-universe choices.', 'fun', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600', 'STANDARD', 'COINS', 200, 35, 34200, 4.85, '❓', 'from-[#2D163D] to-[#4A2464]'),
('deck_work_life', 'work-life', 'Work & Life Balance', 'Thoughtful prompts on career ambition, burnout recovery, and finding peace.', 'wellness', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600', 'STANDARD', 'COINS', 200, 30, 28400, 4.79, '🌿', 'from-[#1C2638] to-[#2B3E5C]');

-- SEED CARDS
INSERT OR IGNORE INTO cards (id, deck_id, order_index, default_question) VALUES
('c_deep_1', 'deck_deep', 1, 'Share something about the "true you" that only your closest friends know.'),
('c_deep_2', 'deck_deep', 2, 'What is a core memory from your childhood that shaped the way you view the world today?'),
('c_deep_3', 'deck_deep', 3, 'If you could apologize to one person from your past with zero consequences, who would it be and why?'),
('c_deep_4', 'deck_deep', 4, 'What is a dream you gave up on, and do you secretly still want to pursue it?'),
('c_deep_5', 'deck_deep', 5, 'When was the last time you felt truly understood by another human being?'),
('c_deep_6', 'deck_deep', 6, 'What is something you pretend to understand or care about just to fit in?'),
('c_deep_7', 'deck_deep', 7, 'What fear holds you back the most from living your most authentic life?'),
('c_deep_8', 'deck_deep', 8, 'If you had one year left to live with full health and unlimited resources, how would you spend your time?'),

('c_rel_1', 'deck_relationships', 1, 'What is the most vulnerable thing a romantic partner has ever shared with you?'),
('c_rel_2', 'deck_relationships', 2, 'How do you instinctively react when someone you care about goes emotionally cold?'),
('c_rel_3', 'deck_relationships', 3, 'What does feeling safe in love truly mean to you?'),
('c_rel_4', 'deck_relationships', 4, 'What is a habit you have that makes you challenging to love sometimes?'),
('c_rel_5', 'deck_relationships', 5, 'What is the greatest lesson a past heartbreak taught you about who you are?'),

('c_mind_1', 'deck_mind', 1, 'What thought or worry keeps you awake at 2 AM most often?'),
('c_mind_2', 'deck_mind', 2, 'Do you think humans are fundamentally good, or fundamentally self-interested? Why?'),
('c_mind_3', 'deck_mind', 3, 'What is a belief you held passionately 5 years ago that you now disagree with?'),
('c_mind_4', 'deck_mind', 4, 'How do you talk to yourself in your head when you make a painful mistake?'),

('c_fun_1', 'deck_friends', 1, 'What is the most ridiculous lie you told as a child that everyone believed?'),
('c_fun_2', 'deck_friends', 2, 'If your life was turned into a sitcom, what would the running gag about you be?'),
('c_fun_3', 'deck_friends', 3, 'What is an utterly irrational pet peeve that instantly annoys you?'),
('c_fun_4', 'deck_friends', 4, 'Which song is your guilty pleasure that you blast when nobody is listening?');
