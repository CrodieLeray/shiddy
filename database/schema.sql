-- PictoChat Database Schema
-- This schema supports persistent global messages and flexible usernames

-- Users table - tracks username sessions but allows changes
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    current_username VARCHAR(50) NOT NULL,
    user_color VARCHAR(7) DEFAULT '#000080',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Messages table - persistent global PictoChat messages
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    user_session_id VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL, -- Store username at time of message
    user_color VARCHAR(7) NOT NULL,
    room_name VARCHAR(100) DEFAULT 'Global Shiddy Board',
    message_text TEXT,
    drawing_data LONGTEXT, -- Base64 encoded canvas image
    message_type ENUM('text', 'drawing', 'both') DEFAULT 'text',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Index for performance
    INDEX idx_room_created (room_name, created_at),
    INDEX idx_session_created (user_session_id, created_at),
    INDEX idx_created_deleted (created_at, is_deleted)
);

-- Username history - track username changes (optional for moderation)
CREATE TABLE username_history (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_session_changed (session_id, changed_at)
);

-- Auto-cleanup procedure for 30-day message retention
DELIMITER //
CREATE EVENT cleanup_old_messages
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    -- Mark messages older than 30 days as deleted
    UPDATE messages 
    SET is_deleted = TRUE 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) 
    AND is_deleted = FALSE;
    
    -- Actually delete messages older than 35 days (5 day grace period)
    DELETE FROM messages 
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 35 DAY);
    
    -- Clean up inactive user sessions older than 30 days
    DELETE FROM users 
    WHERE last_active < DATE_SUB(NOW(), INTERVAL 30 DAY);
    
    -- Clean up old username history older than 90 days
    DELETE FROM username_history 
    WHERE changed_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
END //
DELIMITER ;

-- Enable the event scheduler
SET GLOBAL event_scheduler = ON;

-- Sample indexes for better performance
CREATE INDEX idx_messages_recent ON messages(created_at DESC) WHERE is_deleted = FALSE;
CREATE INDEX idx_users_active ON users(last_active DESC);

-- Sample data for testing (optional)
INSERT INTO users (session_id, current_username, user_color) VALUES 
('demo-session-1', 'ShiddyArtist420', '#FF0080'),
('demo-session-2', 'PixelMaster', '#00FF80'),
('demo-session-3', 'DoodleKing', '#8000FF');

INSERT INTO messages (user_session_id, username, user_color, message_text, message_type) VALUES
('demo-session-1', 'ShiddyArtist420', '#FF0080', 'Welcome to the global PictoChat! 🎨', 'text'),
('demo-session-2', 'PixelMaster', '#00FF80', 'This is so cool! Love the retro vibes', 'text'),
('demo-session-3', 'DoodleKing', '#8000FF', 'Anyone want to collaborate on some art?', 'text');
