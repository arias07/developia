-- ============================================
-- MIGRACIÓN: Agregar columnas para desarrollo autónomo
-- ============================================

-- Agregar columnas a la tabla projects
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS repository_url TEXT,
ADD COLUMN IF NOT EXISTS deployment_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Actualizar el tipo ENUM de status si no incluye los nuevos estados
DO $$
BEGIN
    -- Intentar agregar nuevos valores al enum si no existen
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'in_development' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'project_status')) THEN
        ALTER TYPE project_status ADD VALUE 'in_development';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'deploying' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'project_status')) THEN
        ALTER TYPE project_status ADD VALUE 'deploying';
    END IF;
EXCEPTION
    WHEN others THEN
        -- Si el enum no existe o hay otro error, crear las columnas como text
        NULL;
END $$;

-- Índice para búsquedas rápidas por estado
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Índice para metadata JSONB
CREATE INDEX IF NOT EXISTS idx_projects_metadata ON projects USING GIN (metadata);

-- Comentarios
COMMENT ON COLUMN projects.repository_url IS 'URL del repositorio GitHub generado';
COMMENT ON COLUMN projects.deployment_url IS 'URL del deployment en Vercel';
COMMENT ON COLUMN projects.metadata IS 'Metadata adicional del proyecto (resultados de desarrollo, configuración, etc.)';
