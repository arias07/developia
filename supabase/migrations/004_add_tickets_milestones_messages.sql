-- ============================================
-- MIGRACIÓN: Agregar tablas para tickets, milestones y mensajes
-- ============================================

-- ============================================
-- TABLA: tickets (Sistema de soporte)
-- ============================================
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT DEFAULT 'general',
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para tickets
CREATE INDEX IF NOT EXISTS idx_tickets_project ON tickets(project_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- RLS para tickets
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets" ON tickets
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'project_manager'))
  );

CREATE POLICY "Users can create tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update tickets" ON tickets
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'project_manager'))
  );

-- ============================================
-- TABLA: ticket_messages (Mensajes de tickets)
-- ============================================
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para ticket_messages
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);

-- RLS para ticket_messages
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of their tickets" ON ticket_messages
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM tickets WHERE user_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'project_manager'))
  );

CREATE POLICY "Users can create messages" ON ticket_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- TABLA: milestones (Hitos del proyecto)
-- ============================================
DROP TABLE IF EXISTS milestones CASCADE;
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  deliverables TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para milestones
CREATE INDEX IF NOT EXISTS idx_milestones_project ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON milestones(status);

-- RLS para milestones
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view milestones of their projects" ON milestones
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()) OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'project_manager', 'developer'))
  );

CREATE POLICY "Admins can manage milestones" ON milestones
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'project_manager'))
  );

-- ============================================
-- TABLA: messages (Chat del proyecto)
-- ============================================
DROP TABLE IF EXISTS messages CASCADE;
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para messages
CREATE INDEX IF NOT EXISTS idx_messages_project ON messages(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);

-- RLS para messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of their projects" ON messages
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE client_id = auth.uid()) OR
    sender_id = auth.uid() OR
    receiver_id = auth.uid() OR
    auth.uid() IN (SELECT id FROM profiles WHERE role IN ('admin', 'project_manager'))
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Habilitar Realtime para mensajes
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER milestones_updated_at
  BEFORE UPDATE ON milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comentarios
COMMENT ON TABLE tickets IS 'Sistema de tickets de soporte para proyectos';
COMMENT ON TABLE ticket_messages IS 'Mensajes dentro de tickets de soporte';
COMMENT ON TABLE milestones IS 'Hitos y fases del proyecto';
COMMENT ON TABLE messages IS 'Chat en tiempo real del proyecto';
