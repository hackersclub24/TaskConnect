-- Migrate task status from 'open' to 'available'
UPDATE tasks SET status = 'available' WHERE status = 'open';
