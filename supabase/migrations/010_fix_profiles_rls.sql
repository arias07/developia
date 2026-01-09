-- Migration: Fix Profiles RLS Policies
-- The current policies have a recursion issue where checking admin role
-- requires querying the profiles table, which triggers RLS check again.
--
-- Solution: Use a security definer function to check roles without RLS.

-- =============================================
-- 1. DROP EXISTING PROBLEMATIC POLICIES
-- =============================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- =============================================
-- 2. CREATE HELPER FUNCTION (SECURITY DEFINER)
-- =============================================
-- This function bypasses RLS to check user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role::TEXT INTO user_role
    FROM profiles
    WHERE id = user_id;

    RETURN COALESCE(user_role, 'client');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon;

-- =============================================
-- 3. CREATE NEW RLS POLICIES
-- =============================================

-- Policy 1: Everyone can read their own profile (always works)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Admins and project managers can view all profiles
-- Uses security definer function to avoid recursion
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT
    USING (
        get_user_role(auth.uid()) IN ('admin', 'project_manager')
    );

-- Policy 4: Admins can update any profile
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE
    USING (
        get_user_role(auth.uid()) = 'admin'
    )
    WITH CHECK (
        get_user_role(auth.uid()) = 'admin'
    );

-- Policy 5: System can insert profiles (for trigger on auth.users)
-- Note: The handle_new_user trigger already uses SECURITY DEFINER
CREATE POLICY "System can insert profiles" ON profiles
    FOR INSERT
    WITH CHECK (true);

-- =============================================
-- 4. VERIFY: Ensure service role can always access
-- =============================================
-- Service role bypasses RLS by default, but let's make sure
-- the anon and authenticated roles have proper grants

GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT SELECT ON profiles TO anon;

-- =============================================
-- 5. ALSO FIX THE handle_new_user FUNCTION
-- =============================================
-- Ensure it handles cases where profile might already exist
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
