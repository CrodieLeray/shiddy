-- Supabase Schema for PictoChat
-- Run these commands in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - tracks username sessions but allows changes
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    current_username VARCHAR(50) NOT NULL,
    user_color VARCHAR(7) DEFAULT '#000080',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table - persistent global PictoChat messages
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_session_id VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL, -- Store username at time of message
    user_color VARCHAR(7) NOT NULL,
    room_name VARCHAR(100) DEFAULT 'Global Shiddy Board',
    message_text TEXT,
    drawing_data TEXT, -- Base64 encoded canvas image
    message_type VARCHAR(20) CHECK (message_type IN ('text', 'drawing', 'both')) DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE
);

-- Username history - track username changes (optional for moderation)
CREATE TABLE IF NOT EXISTS username_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_room_created ON messages(room_name, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages(user_session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_created_deleted ON messages(created_at, is_deleted);
CREATE INDEX IF NOT EXISTS idx_users_session ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_username_history_session ON username_history(session_id, changed_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function for cleanup of old data (30+ days)
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Mark messages older than 30 days as deleted
    UPDATE messages 
    SET is_deleted = TRUE 
    WHERE created_at < NOW() - INTERVAL '30 days' 
    AND is_deleted = FALSE;
    
    -- Actually delete messages older than 35 days (5 day grace period)
    DELETE FROM messages 
    WHERE created_at < NOW() - INTERVAL '35 days';
    
    -- Clean up inactive user sessions older than 30 days
    DELETE FROM users 
    WHERE last_active < NOW() - INTERVAL '30 days';
    
    -- Clean up old username history older than 90 days
    DELETE FROM username_history 
    WHERE changed_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE username_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all operations for now (you can restrict later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all operations on username_history" ON username_history FOR ALL USING (true);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Sample data for testing (optional - remove in production)
INSERT INTO users (session_id, current_username, user_color) VALUES 
('demo-session-1', 'ShiddyArtist420', '#FF0080'),
('demo-session-2', 'PixelMaster', '#00FF80'),
('demo-session-3', 'DoodleKing', '#8000FF')
ON CONFLICT (session_id) DO NOTHING;

INSERT INTO messages (user_session_id, username, user_color, message_text, message_type) VALUES
('demo-session-1', 'ShiddyArtist420', '#FF0080', 'Welcome to the global PictoChat! 🎨', 'text'),
('demo-session-2', 'PixelMaster', '#00FF80', 'This is so cool! Love the retro vibes', 'text'),
('demo-session-3', 'DoodleKing', '#8000FF', 'Anyone want to collaborate on some art?', 'text');
