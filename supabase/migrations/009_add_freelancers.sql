-- Migration: Add Freelancer System
-- Tables for freelancer recruitment, management, and task assignment
-- This migration is idempotent and can be run multiple times safely

-- =============================================
-- 0. CLEANUP: Drop existing objects safely
-- =============================================

-- Drop tables with CASCADE (this also drops triggers, policies, indexes)
DROP TABLE IF EXISTS freelancer_reviews CASCADE;
DROP TABLE IF EXISTS freelancer_payments CASCADE;
DROP TABLE IF EXISTS freelancer_time_logs CASCADE;
DROP TABLE IF EXISTS freelancer_tasks CASCADE;
DROP TABLE IF EXISTS freelancer_assignments CASCADE;
DROP TABLE IF EXISTS freelancer_applications CASCADE;
DROP TABLE IF EXISTS freelancer_profiles CASCADE;

-- Drop functions (in case they weren't dropped by CASCADE)
DROP FUNCTION IF EXISTS update_freelancer_stats() CASCADE;
DROP FUNCTION IF EXISTS update_freelancer_rating() CASCADE;

-- =============================================
-- 1. FREELANCER PROFILES
-- =============================================
CREATE TABLE freelancer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Personal Info
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    country TEXT,
    city TEXT,
    timezone TEXT DEFAULT 'America/Mexico_City',

    -- Professional Info
    title TEXT,
    bio TEXT,
    years_experience INTEGER DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    currency TEXT DEFAULT 'USD',

    -- Skills & Expertise
    primary_skills TEXT[] DEFAULT '{}',
    secondary_skills TEXT[] DEFAULT '{}',
    specializations TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT ARRAY['es'],

    -- Portfolio
    portfolio_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    resume_url TEXT,

    -- Status & Availability
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'inactive')),
    availability TEXT DEFAULT 'available' CHECK (availability IN ('available', 'busy', 'unavailable')),
    weekly_hours_available INTEGER DEFAULT 40,

    -- Performance Metrics
    total_projects_completed INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    total_earnings DECIMAL(12,2) DEFAULT 0,

    -- Internal
    internal_notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. FREELANCER APPLICATIONS
-- =============================================
CREATE TABLE freelancer_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Applicant Info
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    city TEXT,

    -- Professional Info
    title TEXT,
    bio TEXT,
    years_experience INTEGER,
    expected_hourly_rate DECIMAL(10,2),

    -- Skills
    primary_skills TEXT[] DEFAULT '{}',
    secondary_skills TEXT[] DEFAULT '{}',
    specializations TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT ARRAY['es'],

    -- Portfolio
    portfolio_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    resume_url TEXT,

    -- Application Details
    cover_letter TEXT,
    availability TEXT,
    weekly_hours_available INTEGER,
    start_date DATE,

    -- Referral
    referral_source TEXT,
    referral_code TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'interview', 'approved', 'rejected')),
    rejection_reason TEXT,

    -- Review
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    interview_scheduled_at TIMESTAMPTZ,
    interview_notes TEXT,

    -- Conversion
    freelancer_id UUID REFERENCES freelancer_profiles(id),
    converted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. FREELANCER ASSIGNMENTS
-- =============================================
CREATE TABLE freelancer_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,

    -- Assignment Details
    role TEXT NOT NULL,
    assigned_team_member_id UUID,

    -- Status
    status TEXT DEFAULT 'active' CHECK (status IN ('pending', 'active', 'paused', 'completed', 'cancelled')),

    -- Time & Budget
    estimated_hours INTEGER,
    actual_hours DECIMAL(10,2) DEFAULT 0,
    hourly_rate DECIMAL(10,2),
    budget_cap DECIMAL(12,2),

    -- Dates
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ,

    -- Notes
    assignment_notes TEXT,
    completion_notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(freelancer_id, project_id)
);

-- =============================================
-- 4. FREELANCER TASKS
-- =============================================
CREATE TABLE freelancer_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES freelancer_assignments(id) ON DELETE CASCADE,
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,

    -- References (soft - no FK)
    escalation_id UUID,
    ticket_id UUID,
    milestone_id UUID,

    -- Task Details
    title TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'development' CHECK (type IN ('development', 'bugfix', 'review', 'design', 'consultation', 'other')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'review', 'completed', 'rejected', 'cancelled')),

    -- Time
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2) DEFAULT 0,

    -- Payment
    fixed_amount DECIMAL(10,2),
    hourly_rate DECIMAL(10,2),
    total_paid DECIMAL(10,2) DEFAULT 0,

    -- Dates
    accepted_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ,

    -- Deliverables
    deliverable_url TEXT,
    deliverable_notes TEXT,

    -- Review
    review_rating INTEGER CHECK (review_rating >= 1 AND review_rating <= 5),
    review_comment TEXT,
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. FREELANCER TIME LOGS
-- =============================================
CREATE TABLE freelancer_time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES freelancer_tasks(id) ON DELETE CASCADE,

    -- Time Entry
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    duration_minutes INTEGER,

    -- Description
    description TEXT,

    -- Status
    status TEXT DEFAULT 'logged' CHECK (status IN ('logged', 'approved', 'rejected', 'paid')),
    approved_by UUID,
    approved_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. FREELANCER PAYMENTS
-- =============================================
CREATE TABLE freelancer_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,

    -- Payment Details
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'USD',

    -- Period
    period_start DATE,
    period_end DATE,

    -- Tasks included
    task_ids UUID[] DEFAULT '{}',
    time_log_ids UUID[] DEFAULT '{}',

    -- Payment Method
    payment_method TEXT,
    payment_reference TEXT,

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

    -- Processing
    processed_by UUID,
    processed_at TIMESTAMPTZ,

    -- Notes
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. FREELANCER REVIEWS
-- =============================================
CREATE TABLE freelancer_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    freelancer_id UUID NOT NULL REFERENCES freelancer_profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL,
    reviewer_id UUID NOT NULL,

    -- Rating (1-5)
    overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
    timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),

    -- Review
    title TEXT,
    comment TEXT,

    -- Visibility
    is_public BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_freelancer_profiles_status ON freelancer_profiles(status);
CREATE INDEX idx_freelancer_profiles_availability ON freelancer_profiles(availability);
CREATE INDEX idx_freelancer_profiles_skills ON freelancer_profiles USING GIN(primary_skills);
CREATE INDEX idx_freelancer_applications_status ON freelancer_applications(status);
CREATE INDEX idx_freelancer_applications_email ON freelancer_applications(email);
CREATE INDEX idx_freelancer_assignments_freelancer ON freelancer_assignments(freelancer_id);
CREATE INDEX idx_freelancer_assignments_project ON freelancer_assignments(project_id);
CREATE INDEX idx_freelancer_tasks_freelancer ON freelancer_tasks(freelancer_id);
CREATE INDEX idx_freelancer_tasks_status ON freelancer_tasks(status);
CREATE INDEX idx_freelancer_tasks_escalation ON freelancer_tasks(escalation_id);
CREATE INDEX idx_freelancer_time_logs_task ON freelancer_time_logs(task_id);
CREATE INDEX idx_freelancer_payments_freelancer ON freelancer_payments(freelancer_id);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_freelancer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE freelancer_profiles
        SET
            total_tasks_completed = total_tasks_completed + 1,
            updated_at = NOW()
        WHERE id = NEW.freelancer_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_freelancer_stats
    AFTER UPDATE ON freelancer_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_freelancer_stats();

CREATE OR REPLACE FUNCTION update_freelancer_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE freelancer_profiles
    SET
        average_rating = (
            SELECT AVG(overall_rating)::DECIMAL(3,2)
            FROM freelancer_reviews
            WHERE freelancer_id = NEW.freelancer_id
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM freelancer_reviews
            WHERE freelancer_id = NEW.freelancer_id
        ),
        updated_at = NOW()
    WHERE id = NEW.freelancer_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_freelancer_rating
    AFTER INSERT OR UPDATE ON freelancer_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_freelancer_rating();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_time_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_reviews ENABLE ROW LEVEL SECURITY;

-- Freelancer profile policies
CREATE POLICY "Freelancers can view own profile" ON freelancer_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Freelancers can update own profile" ON freelancer_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage freelancer profiles" ON freelancer_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
        )
    );

-- Application policies
CREATE POLICY "Admins can manage applications" ON freelancer_applications
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
        )
    );

CREATE POLICY "Anyone can submit application" ON freelancer_applications
    FOR INSERT WITH CHECK (true);

-- Assignment policies
CREATE POLICY "Freelancers can view own assignments" ON freelancer_assignments
    FOR SELECT USING (
        freelancer_id IN (
            SELECT id FROM freelancer_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage assignments" ON freelancer_assignments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
        )
    );

-- Task policies
CREATE POLICY "Freelancers can view own tasks" ON freelancer_tasks
    FOR SELECT USING (
        freelancer_id IN (
            SELECT id FROM freelancer_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Freelancers can update own tasks" ON freelancer_tasks
    FOR UPDATE USING (
        freelancer_id IN (
            SELECT id FROM freelancer_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage tasks" ON freelancer_tasks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
        )
    );

-- Time log policies
CREATE POLICY "Freelancers can manage own time logs" ON freelancer_time_logs
    FOR ALL USING (
        freelancer_id IN (
            SELECT id FROM freelancer_profiles WHERE user_id = auth.uid()
        )
    );

-- Payment policies
CREATE POLICY "Freelancers can view own payments" ON freelancer_payments
    FOR SELECT USING (
        freelancer_id IN (
            SELECT id FROM freelancer_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage payments" ON freelancer_payments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
        )
    );

-- Review policies
CREATE POLICY "Public reviews are visible" ON freelancer_reviews
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage reviews" ON freelancer_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role IN ('admin', 'project_manager')
        )
    );
