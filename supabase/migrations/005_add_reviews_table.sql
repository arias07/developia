-- ============================================
-- MIGRATION: Add Reviews Table
-- ============================================

-- Eliminar tablas si existen para evitar conflictos
DROP TABLE IF EXISTS review_comments CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

-- Reviews table for project feedback
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'changes_requested')),
    feedback TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    reviewer_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Review comments table
CREATE TABLE review_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_project_id ON reviews(project_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_review_comments_review_id ON review_comments(review_id);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Users can view reviews for their projects" ON reviews
    FOR SELECT USING (
        auth.uid() IN (
            SELECT client_id FROM projects WHERE id = reviews.project_id
        )
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can create reviews" ON reviews
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users and admins can update reviews" ON reviews
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT client_id FROM projects WHERE id = reviews.project_id
        )
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Review comments policies
CREATE POLICY "Users can view comments for reviews they can see" ON review_comments
    FOR SELECT USING (
        auth.uid() IN (
            SELECT p.client_id FROM projects p
            JOIN reviews r ON r.project_id = p.id
            WHERE r.id = review_comments.review_id
        )
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can create comments on reviews" ON review_comments
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT p.client_id FROM projects p
            JOIN reviews r ON r.project_id = p.id
            WHERE r.id = review_comments.review_id
        )
        OR
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- Trigger for updated_at on reviews
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();

-- Enable realtime for review_comments
ALTER PUBLICATION supabase_realtime ADD TABLE review_comments;
