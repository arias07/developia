-- DevelopIA Platform - Initial Database Schema
-- Run this in Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ENUMS
CREATE TYPE user_role AS ENUM ('client', 'admin', 'project_manager', 'developer', 'designer', 'freelancer', 'consultant');

CREATE TYPE project_status AS ENUM ('draft', 'requirements', 'quoted', 'paid', 'in_progress', 'review', 'completed', 'cancelled');

CREATE TYPE project_type AS ENUM ('landing_page', 'website', 'web_app', 'mobile_app', 'ecommerce', 'saas', 'api', 'game', 'custom');

CREATE TYPE project_complexity AS ENUM ('simple', 'medium', 'complex', 'enterprise');

CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

CREATE TYPE consultation_type AS ENUM ('discovery', 'technical', 'design', 'strategy', 'support');

CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'blocked');

CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role DEFAULT 'client',
    phone TEXT,
    company TEXT,
    timezone TEXT DEFAULT 'America/Mexico_City',
    preferred_language TEXT DEFAULT 'es' CHECK (preferred_language IN ('es', 'en')),
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROJECTS
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    type project_type NOT NULL,
    complexity project_complexity DEFAULT 'medium',
    status project_status DEFAULT 'draft',

    -- Requirements & Documentation
    requirements_json JSONB DEFAULT '{}',
    prd_document TEXT,
    user_stories JSONB DEFAULT '[]',
    tech_stack TEXT[] DEFAULT '{}',

    -- Financials
    estimated_price DECIMAL(12, 2) DEFAULT 0,
    final_price DECIMAL(12, 2),
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'MXN')),

    -- Timeline
    estimated_duration_days INTEGER DEFAULT 30,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    deadline TIMESTAMPTZ,

    -- Progress
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_phase TEXT DEFAULT 'Planning',

    -- AI Generation
    ai_generated BOOLEAN DEFAULT TRUE,
    github_repo_url TEXT,
    deployment_url TEXT,

    -- Team
    project_manager_id UUID REFERENCES profiles(id),
    team_members UUID[] DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAYMENTS
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES profiles(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'MXN')),
    status payment_status DEFAULT 'pending',
    payment_type TEXT DEFAULT 'full' CHECK (payment_type IN ('full', 'deposit', 'milestone', 'maintenance')),
    stripe_payment_intent_id TEXT UNIQUE,
    stripe_invoice_id TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MILESTONES
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    "order" INTEGER NOT NULL,
    status task_status DEFAULT 'pending',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    deliverables TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TASKS
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'pending',
    priority task_priority DEFAULT 'medium',
    estimated_hours DECIMAL(6, 2),
    actual_hours DECIMAL(6, 2),
    ai_generated BOOLEAN DEFAULT FALSE,
    github_issue_url TEXT,
    due_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- QUOTATIONS
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    items JSONB DEFAULT '[]',
    subtotal DECIMAL(12, 2) DEFAULT 0,
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_percentage DECIMAL(5, 2) DEFAULT 16,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    total DECIMAL(12, 2) DEFAULT 0,
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'MXN')),
    valid_until TIMESTAMPTZ,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CONSULTATIONS
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    consultant_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    type consultation_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_url TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TEAM MEMBERS
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    specializations TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(8, 2),
    availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
    current_projects UUID[] DEFAULT '{}',
    max_concurrent_projects INTEGER DEFAULT 3,
    rating DECIMAL(3, 2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    completed_projects_count INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- FREELANCER APPLICATIONS
CREATE TABLE freelancer_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    portfolio_url TEXT NOT NULL,
    resume_url TEXT,
    specializations TEXT[] NOT NULL,
    years_experience INTEGER NOT NULL,
    hourly_rate_expected DECIMAL(8, 2) NOT NULL,
    availability_hours_week INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MESSAGES
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    action_url TEXT,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ACTIVITY LOG
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTION PLANS
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'MXN')),
    features TEXT[] DEFAULT '{}',
    support_hours INTEGER DEFAULT 0,
    updates_included BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'paused')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    stripe_subscription_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FUNNEL SESSIONS (para tracking del embudo)
CREATE TABLE funnel_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visitor_id TEXT, -- anonymous visitor tracking
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    current_step INTEGER DEFAULT 1,
    max_step_reached INTEGER DEFAULT 1,
    partial_data JSONB DEFAULT '{}',
    converted_to_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    referrer TEXT
);

-- INDEXES for performance
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
CREATE INDEX idx_payments_project_id ON payments(project_id);
CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_messages_project_id ON messages(project_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at) WHERE read_at IS NULL;
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX idx_funnel_sessions_visitor_id ON funnel_sessions(visitor_id);

-- TRIGGERS for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- TRIGGER: Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_sessions ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES

-- Profiles: Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
    );

-- Projects: Clients see their own, team members see assigned
CREATE POLICY "Clients can view own projects" ON projects
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Clients can create projects" ON projects
    FOR INSERT WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own projects in draft" ON projects
    FOR UPDATE USING (client_id = auth.uid() AND status IN ('draft', 'requirements'));

CREATE POLICY "Team can view assigned projects" ON projects
    FOR SELECT USING (
        project_manager_id = auth.uid() OR
        auth.uid() = ANY(team_members) OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
    );

CREATE POLICY "Admins can manage all projects" ON projects
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Payments: Clients see their own payments
CREATE POLICY "Clients can view own payments" ON payments
    FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "Admins can manage payments" ON payments
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
    );

-- Messages: Users can see messages they sent or received
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Notifications: Users see their own
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Funnel sessions: Anonymous can create, users see their own
CREATE POLICY "Anyone can create funnel session" ON funnel_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their funnel session" ON funnel_sessions
    FOR UPDATE USING (true);

CREATE POLICY "Users can view own funnel sessions" ON funnel_sessions
    FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, price_monthly, price_yearly, features, support_hours, updates_included) VALUES
('Basic', 'Mantenimiento básico para proyectos pequeños', 49, 490, ARRAY['Hosting incluido', 'SSL/HTTPS', 'Backups semanales', 'Soporte por email', '2 horas de cambios/mes'], 2, true),
('Professional', 'Ideal para negocios en crecimiento', 149, 1490, ARRAY['Todo en Basic', 'Backups diarios', 'CDN incluido', 'Soporte prioritario', '5 horas de cambios/mes', 'Reportes mensuales'], 5, true),
('Enterprise', 'Para proyectos de misión crítica', 499, 4990, ARRAY['Todo en Professional', 'SLA 99.9%', 'Soporte 24/7', '15 horas de cambios/mes', 'Gerente de cuenta dedicado', 'Auditorías de seguridad'], 15, true);
