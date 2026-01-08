-- DevelopIA Platform - Escalation System
-- For tracking AI failures that need human intervention

-- ENUM for escalation types
CREATE TYPE escalation_type AS ENUM (
  'technical_failure',    -- AI couldn't complete development
  'capacity_limit',       -- AI hit a technical limit
  'quality_issue',        -- Generated code has issues
  'client_request',       -- Client requested human intervention
  'timeout',              -- Process timed out
  'external_api_failure'  -- GitHub/Vercel/etc failed
);

-- ENUM for escalation severity
CREATE TYPE escalation_severity AS ENUM (
  'critical',  -- Project completely blocked
  'high',      -- Major functionality affected
  'medium',    -- Partial issues, workaround possible
  'low'        -- Minor issues
);

-- ENUM for escalation status
CREATE TYPE escalation_status AS ENUM (
  'pending',      -- Waiting for assignment
  'assigned',     -- Assigned to human
  'in_progress',  -- Human is working on it
  'resolved',     -- Issue fixed
  'cancelled'     -- Escalation cancelled
);

-- ESCALATIONS TABLE
CREATE TABLE escalations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Classification
    type escalation_type NOT NULL,
    severity escalation_severity NOT NULL,
    status escalation_status NOT NULL DEFAULT 'pending',

    -- Error details
    error_message TEXT,
    error_stack TEXT,
    failed_phase TEXT,
    ai_attempts INTEGER DEFAULT 1,

    -- Context
    context_data JSONB DEFAULT '{}',

    -- Assignment to real human
    assigned_to UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ,

    -- Resolution
    resolution_notes TEXT,
    resolution_data JSONB DEFAULT '{}',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),

    -- Notifications sent
    email_sent BOOLEAN DEFAULT false,
    whatsapp_sent BOOLEAN DEFAULT false,
    app_notified BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_escalations_project_id ON escalations(project_id);
CREATE INDEX idx_escalations_status ON escalations(status);
CREATE INDEX idx_escalations_severity ON escalations(severity);
CREATE INDEX idx_escalations_assigned_to ON escalations(assigned_to);
CREATE INDEX idx_escalations_created_at ON escalations(created_at DESC);
CREATE INDEX idx_escalations_pending ON escalations(status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins and project managers can view escalations
CREATE POLICY "Admins can view all escalations" ON escalations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
    );

CREATE POLICY "Assigned users can view their escalations" ON escalations
    FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Admins can manage escalations" ON escalations
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
    );

-- Service role can insert
CREATE POLICY "Service can create escalations" ON escalations
    FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_escalations_updated_at
    BEFORE UPDATE ON escalations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-assign escalation based on severity
CREATE OR REPLACE FUNCTION auto_assign_escalation()
RETURNS TRIGGER AS $$
DECLARE
    available_admin UUID;
BEGIN
    -- For critical escalations, try to find an available admin
    IF NEW.severity = 'critical' AND NEW.assigned_to IS NULL THEN
        SELECT p.id INTO available_admin
        FROM profiles p
        JOIN team_members tm ON tm.profile_id = p.id
        WHERE p.role IN ('admin', 'project_manager')
        AND tm.availability_status = 'available'
        ORDER BY tm.current_projects, tm.rating DESC
        LIMIT 1;

        IF available_admin IS NOT NULL THEN
            NEW.assigned_to := available_admin;
            NEW.assigned_at := NOW();
            NEW.status := 'assigned';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_escalation
    BEFORE INSERT ON escalations
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_escalation();

-- View for escalation dashboard
CREATE OR REPLACE VIEW escalation_dashboard AS
SELECT
    e.*,
    p.name as project_name,
    p.type as project_type,
    c.full_name as client_name,
    c.email as client_email,
    a.full_name as assigned_name,
    a.email as assigned_email
FROM escalations e
JOIN projects p ON p.id = e.project_id
JOIN profiles c ON c.id = p.client_id
LEFT JOIN profiles a ON a.id = e.assigned_to
ORDER BY
    CASE e.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
    END,
    e.created_at DESC;
