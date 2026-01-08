-- DevelopIA Platform - Fictional Team Members per Project
-- This table stores the fictional team assigned to each project for client perception

-- ENUM for fictional team roles
CREATE TYPE fictional_team_role AS ENUM (
  'project_manager',
  'senior_developer',
  'junior_developer'
);

-- PROJECT TEAM MEMBERS (Fictional)
CREATE TABLE project_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

    -- Member display info (shown to client)
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    role fictional_team_role NOT NULL,
    title TEXT NOT NULL,
    specializations TEXT[] DEFAULT '{}',
    bio TEXT,

    -- Internal tracking (not shown to client)
    internal_code TEXT NOT NULL UNIQUE,

    -- Metadata
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create unique constraint for role per project (only one PM per project, etc.)
-- But allow multiple juniors
CREATE UNIQUE INDEX idx_unique_pm_per_project
    ON project_team_members(project_id)
    WHERE role = 'project_manager';

CREATE UNIQUE INDEX idx_unique_senior_per_project
    ON project_team_members(project_id)
    WHERE role = 'senior_developer';

-- Indexes for performance
CREATE INDEX idx_project_team_project_id ON project_team_members(project_id);
CREATE INDEX idx_project_team_role ON project_team_members(role);
CREATE INDEX idx_project_team_internal_code ON project_team_members(internal_code);

-- Enable RLS
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Clients can view team members of their own projects
CREATE POLICY "Clients can view their project team" ON project_team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_team_members.project_id
            AND projects.client_id = auth.uid()
        )
    );

-- Admins can manage all team members
CREATE POLICY "Admins can manage project teams" ON project_team_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
    );

-- Service role can insert (for automated assignment)
CREATE POLICY "Service can insert team members" ON project_team_members
    FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_project_team_members_updated_at
    BEFORE UPDATE ON project_team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sequence for internal codes
CREATE SEQUENCE IF NOT EXISTS pm_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS sr_code_seq START 1;
CREATE SEQUENCE IF NOT EXISTS jr_code_seq START 1;

-- Function to generate internal codes
CREATE OR REPLACE FUNCTION generate_team_member_code(member_role fictional_team_role)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    seq_val INTEGER;
    year_suffix TEXT;
BEGIN
    year_suffix := TO_CHAR(NOW(), 'YYYY');

    CASE member_role
        WHEN 'project_manager' THEN
            prefix := 'PM';
            seq_val := nextval('pm_code_seq');
        WHEN 'senior_developer' THEN
            prefix := 'SR';
            seq_val := nextval('sr_code_seq');
        WHEN 'junior_developer' THEN
            prefix := 'JR';
            seq_val := nextval('jr_code_seq');
    END CASE;

    RETURN prefix || '-' || year_suffix || '-' || LPAD(seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
