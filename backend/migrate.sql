-- Run this SQL on your PostgreSQL database if you have an existing Skillstreet DB
-- Run migrations in order; ignore errors for already-existing objects

-- 1. User columns (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS skills TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS college_name VARCHAR(255);

-- 2. Task columns (if not exists)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'paid';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS inter_college_only BOOLEAN DEFAULT FALSE;

-- 3. Set default for existing tasks
UPDATE tasks SET category = 'paid' WHERE category IS NULL;
UPDATE tasks SET inter_college_only = FALSE WHERE inter_college_only IS NULL;

-- 4. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id INTEGER NOT NULL REFERENCES users(id),
  reviewee_id INTEGER NOT NULL REFERENCES users(id),
  task_id INTEGER REFERENCES tasks(id),
  rating INTEGER NOT NULL,
  text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Chat messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Platform reviews (what users write about the platform)
CREATE TABLE IF NOT EXISTS platform_reviews (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  review_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Contact feedback table
CREATE TABLE IF NOT EXISTS contact_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
