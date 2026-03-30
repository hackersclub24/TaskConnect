-- Add file attachment support to chat messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(500) DEFAULT NULL;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255) DEFAULT NULL;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_task_id ON messages(task_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
