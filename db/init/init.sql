-- ==============================
-- Web Matcha Database Schema
-- ==============================

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    gender ENUM('male', 'female') NOT NULL,
    sexual_orientation ENUM('straight', 'gay', 'bisexual') DEFAULT 'bisexual',
    biography TEXT,
    fame_rating INT DEFAULT 0,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    last_login TIMESTAMP,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Photos Table
CREATE TABLE user_photos (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_profile_pic BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Interests Table
CREATE TABLE interests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

-- 4. User Interests Table (Many-to-Many)
CREATE TABLE user_interests (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    interest_id INT REFERENCES interests(id) ON DELETE CASCADE,
    PRIMARY KEY(user_id, interest_id)
);

-- 5. Likes Table
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    from_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    to_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_user_id, to_user_id)
);

-- 6. Profile Views Table
CREATE TABLE profile_views (
    id SERIAL PRIMARY KEY,
    viewer_id INT REFERENCES users(id) ON DELETE CASCADE,
    viewed_id INT REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Blocks and Reports Tables
CREATE TABLE blocks (
    blocker_id INT REFERENCES users(id) ON DELETE CASCADE,
    blocked_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(blocker_id, blocked_id)
);

CREATE TABLE reports (
    reporter_id INT REFERENCES users(id) ON DELETE CASCADE,
    reported_id INT REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(reporter_id, reported_id)
);

-- 8. Chat System
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    user1_id INT REFERENCES users(id) ON DELETE CASCADE,
    user2_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user1_id, user2_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id INT REFERENCES chats(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- 9. Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    type ENUM('like', 'view', 'message', 'match', 'unlike'),
    source_user_id INT REFERENCES users(id),
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Fame Rating History Table (Optional)
CREATE TABLE fame_history (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    rating INT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Constraint 1: One profile picture per user
CREATE UNIQUE INDEX one_profile_pic_per_user
ON user_photos (user_id)
WHERE is_profile_pic IS TRUE;

-- Constraint 2: Check user order in chats table so we don't end up with duplicate chats between two users (need to add a check in the backend)
ALTER TABLE chats
ADD CONSTRAINT check_user_order CHECK (user1_id < user2_id);

-- Constraint 3: Update timestamp for users table automatically
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE INDEX idx_users_lat_lng ON users(latitude, longitude);
CREATE INDEX idx_user_interests_interest_id ON user_interests(interest_id);
CREATE INDEX idx_profile_views_viewed_id ON profile_views(viewed_id);
CREATE INDEX idx_likes_to_user ON likes(to_user_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
