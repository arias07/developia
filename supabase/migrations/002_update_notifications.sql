-- Migration: Update notifications table for real-time notifications
-- Run this in your Supabase SQL Editor

-- Step 1: Add new columns
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Migrate existing data (content -> message)
UPDATE notifications SET message = content WHERE message IS NULL;

-- Step 3: Update type enum to support new notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('payment', 'project', 'message', 'consultation', 'alert', 'info'));

-- Step 4: Update existing 'success' and 'warning' to 'info', 'error' to 'alert'
UPDATE notifications SET type = 'info' WHERE type IN ('success', 'warning');
UPDATE notifications SET type = 'alert' WHERE type = 'error';

-- Step 5: Convert read_at to read boolean
UPDATE notifications SET read = (read_at IS NOT NULL) WHERE read IS NULL;

-- Step 6: Make message NOT NULL (after migration)
ALTER TABLE notifications ALTER COLUMN message SET NOT NULL;

-- Step 7: Drop old columns (optional, keep for backwards compatibility)
-- ALTER TABLE notifications DROP COLUMN IF EXISTS content;
-- ALTER TABLE notifications DROP COLUMN IF EXISTS action_url;
-- ALTER TABLE notifications DROP COLUMN IF EXISTS read_at;

-- Step 8: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Step 9: Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Step 10: Update RLS policies for notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (auth.uid() = user_id);

-- Allow service role to insert notifications (for system notifications)
CREATE POLICY "Service role can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Step 11: Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notifications_updated_at ON notifications;
CREATE TRIGGER trigger_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_updated_at();
