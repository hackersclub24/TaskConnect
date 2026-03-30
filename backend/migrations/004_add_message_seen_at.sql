-- Add seen receipt timestamp for chat messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS seen_at TIMESTAMP NULL;

-- Optional index for filtering unread incoming messages quickly
CREATE INDEX IF NOT EXISTS idx_messages_task_sender_seen
ON messages(task_id, sender_id, seen_at);
