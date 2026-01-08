-- DevelopIA Platform - Project Assistants (24/7 AI Support)
-- Each completed project gets a personalized AI assistant

-- PROJECT ASSISTANTS TABLE
CREATE TABLE project_assistants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,

    -- Assistant identity
    assistant_name TEXT NOT NULL,
    avatar_url TEXT,

    -- AI Configuration
    system_prompt TEXT NOT NULL,
    model TEXT DEFAULT 'claude-sonnet-4-20250514',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 4096,

    -- Project knowledge
    project_summary TEXT,
    tech_stack JSONB DEFAULT '{}',
    features_list JSONB DEFAULT '[]',
    architecture_overview TEXT,
    known_issues JSONB DEFAULT '[]',

    -- FAQ and common questions
    faq JSONB DEFAULT '[]',

    -- Documentation
    documentation_urls TEXT[] DEFAULT '{}',
    codebase_summary TEXT,
    api_endpoints JSONB DEFAULT '[]',

    -- Allowed actions
    can_reset_passwords BOOLEAN DEFAULT true,
    can_clear_cache BOOLEAN DEFAULT true,
    can_restart_service BOOLEAN DEFAULT true,
    can_view_logs BOOLEAN DEFAULT true,
    can_health_check BOOLEAN DEFAULT true,

    -- Integration credentials (encrypted in practice)
    vercel_project_id TEXT,
    supabase_project_ref TEXT,

    -- Usage stats
    total_conversations INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_actions_executed INTEGER DEFAULT 0,

    -- Metadata
    last_interaction TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASSISTANT CONVERSATIONS TABLE
CREATE TABLE assistant_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    assistant_id UUID NOT NULL REFERENCES project_assistants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Conversation title (auto-generated or user-set)
    title TEXT,

    -- Messages stored as JSONB array
    -- Each message: { role: 'user'|'assistant', content: string, timestamp: string, action?: {...} }
    messages JSONB NOT NULL DEFAULT '[]',

    -- Metadata
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    message_count INTEGER DEFAULT 0,

    -- Analytics
    topics_discussed TEXT[] DEFAULT '{}',
    actions_requested TEXT[] DEFAULT '{}',
    actions_executed TEXT[] DEFAULT '{}',

    -- User feedback
    satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
    feedback_text TEXT,

    -- Status
    is_archived BOOLEAN DEFAULT false,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ASSISTANT ACTION LOG TABLE
CREATE TABLE assistant_action_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assistant_id UUID NOT NULL REFERENCES project_assistants(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES assistant_conversations(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Action details
    action_type TEXT NOT NULL,
    action_params JSONB DEFAULT '{}',

    -- Result
    success BOOLEAN NOT NULL,
    result_data JSONB DEFAULT '{}',
    error_message TEXT,

    -- Execution time
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_project_assistants_project_id ON project_assistants(project_id);
CREATE INDEX idx_assistant_conversations_project_id ON assistant_conversations(project_id);
CREATE INDEX idx_assistant_conversations_user_id ON assistant_conversations(user_id);
CREATE INDEX idx_assistant_conversations_assistant_id ON assistant_conversations(assistant_id);
CREATE INDEX idx_assistant_conversations_last_message ON assistant_conversations(last_message_at DESC);
CREATE INDEX idx_assistant_action_logs_assistant_id ON assistant_action_logs(assistant_id);
CREATE INDEX idx_assistant_action_logs_user_id ON assistant_action_logs(user_id);

-- Enable RLS
ALTER TABLE project_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assistant_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_assistants
CREATE POLICY "Clients can view their project assistant" ON project_assistants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = project_assistants.project_id
            AND projects.client_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage assistants" ON project_assistants
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
    );

CREATE POLICY "Service can create assistants" ON project_assistants
    FOR INSERT WITH CHECK (true);

-- RLS Policies for assistant_conversations
CREATE POLICY "Users can view their conversations" ON assistant_conversations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations" ON assistant_conversations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their conversations" ON assistant_conversations
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all conversations" ON assistant_conversations
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
    );

-- RLS Policies for action logs
CREATE POLICY "Users can view their action logs" ON assistant_action_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all action logs" ON assistant_action_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'project_manager'))
    );

CREATE POLICY "Service can insert action logs" ON assistant_action_logs
    FOR INSERT WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_project_assistants_updated_at
    BEFORE UPDATE ON project_assistants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assistant_conversations_updated_at
    BEFORE UPDATE ON assistant_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update assistant stats on new message
CREATE OR REPLACE FUNCTION update_assistant_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update assistant stats
    UPDATE project_assistants
    SET
        total_conversations = total_conversations +
            CASE WHEN TG_OP = 'INSERT' THEN 1 ELSE 0 END,
        last_interaction = NOW(),
        updated_at = NOW()
    WHERE id = NEW.assistant_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assistant_stats
    AFTER INSERT ON assistant_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_assistant_stats();

-- Function to update message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.message_count := jsonb_array_length(NEW.messages);
    NEW.last_message_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_count
    BEFORE UPDATE ON assistant_conversations
    FOR EACH ROW
    WHEN (OLD.messages IS DISTINCT FROM NEW.messages)
    EXECUTE FUNCTION update_conversation_message_count();

-- Enable Realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE assistant_conversations;
