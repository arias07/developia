-- ============================================
-- Migration: Add Jobs Queue
-- Implements database-backed job queue for async task processing
-- ============================================

-- Create enum for job status
CREATE TYPE job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'cancelled');

-- Create enum for job priority
CREATE TYPE job_priority AS ENUM ('low', 'normal', 'high', 'critical');

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job definition
  type TEXT NOT NULL,                              -- Job type (e.g., 'project_development')
  payload JSONB NOT NULL DEFAULT '{}',             -- Job data

  -- Status tracking
  status job_status NOT NULL DEFAULT 'pending',
  priority job_priority NOT NULL DEFAULT 'normal',

  -- Retry logic
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,

  -- Error tracking
  error_message TEXT,
  error_stack TEXT,

  -- Result storage
  result JSONB,

  -- Scheduling
  scheduled_for TIMESTAMPTZ,                       -- When to run (null = immediate)
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Additional metadata
  metadata JSONB DEFAULT '{}'
);

-- Indexes for efficient job processing
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_priority ON jobs(priority DESC);
CREATE INDEX idx_jobs_scheduled ON jobs(scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_created_by ON jobs(created_by);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- Composite index for job queue polling
CREATE INDEX idx_jobs_queue ON jobs(status, priority DESC, created_at ASC)
WHERE status = 'pending';

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_updated_at();

-- RLS Policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- Admins can see all jobs
CREATE POLICY "Admins can view all jobs" ON jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can see their own jobs
CREATE POLICY "Users can view own jobs" ON jobs
  FOR SELECT
  USING (created_by = auth.uid());

-- Service role can do everything (for backend operations)
CREATE POLICY "Service role full access" ON jobs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON jobs TO authenticated;
GRANT ALL ON jobs TO service_role;

-- Add comment for documentation
COMMENT ON TABLE jobs IS 'Database-backed job queue for async task processing';
COMMENT ON COLUMN jobs.type IS 'Job type identifier (e.g., project_development, send_email)';
COMMENT ON COLUMN jobs.payload IS 'Job-specific data as JSON';
COMMENT ON COLUMN jobs.scheduled_for IS 'When the job should run (null = immediate)';
COMMENT ON COLUMN jobs.attempts IS 'Number of times this job has been attempted';
