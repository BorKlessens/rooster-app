-- Add message column to availability table
-- This allows employees to add special notes/remarks to their availability

ALTER TABLE availability 
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN availability.message IS 'Optional message/remarks from employee about their availability (e.g., "I can only work until 20:00")';

