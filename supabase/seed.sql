-- DevelopIA Platform - Seed Data
-- INSTRUCCIONES:
-- 1. Primero crea tu cuenta en la app (signup) o en Supabase Dashboard → Authentication → Users
-- 2. Copia tu UUID de usuario
-- 3. Reemplaza 'TU_USER_ID_AQUI' con tu UUID
-- 4. Ejecuta este script en Supabase SQL Editor

-- =============================================
-- CONFIGURACIÓN - REEMPLAZAR CON TUS DATOS
-- =============================================
DO $$
DECLARE
     -- Reemplazar con tu UUID de auth.users
    admin_user_id UUID := '94205853-4ef2-4bd1-8c40-8e0193d59616';
    admin_email TEXT := 'israelarifra@gmail.com';

    -- Variables para IDs generados
    project_demo_id UUID;
    project_saas_id UUID;
    quotation_id UUID;
BEGIN

-- =============================================
-- 1. ACTUALIZAR PERFIL COMO ADMIN
-- =============================================
UPDATE profiles
SET
    role = 'admin',
    full_name = 'Israel Arias',
    phone = '+5213311219239',
    company = 'Devvy',
    onboarding_completed = true
WHERE id = admin_user_id;

-- Si no existe el perfil, crearlo
INSERT INTO profiles (id, email, full_name, role, phone, company, onboarding_completed)
VALUES (admin_user_id, admin_email, 'Israel Arias', 'admin', '+5213311219239', 'Developia', true)
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'Israel Arias',
    phone = '+5213311219239',
    company = 'Devvy',
    onboarding_completed = true;

-- =============================================
-- 2. CREAR PROYECTOS DE EJEMPLO
-- =============================================

-- Proyecto Demo (Landing Page) - Completado
INSERT INTO projects (
    id, client_id, name, description, type, complexity, status,
    estimated_price, final_price, currency,
    estimated_duration_days, progress_percentage, current_phase,
    tech_stack, ai_generated, deployment_url
) VALUES (
    uuid_generate_v4(),
    admin_user_id,
    'Landing Page - TechStartup',
    'Landing page moderna para startup de tecnología con animaciones, formulario de contacto y optimización SEO.',
    'landing_page',
    'simple',
    'completed',
    500, 500, 'USD',
    7, 100, 'Deployed',
    ARRAY['Next.js', 'TailwindCSS', 'Framer Motion', 'Resend'],
    true,
    'https://techstartup-demo.vercel.app'
) RETURNING id INTO project_demo_id;

-- Proyecto SaaS - En progreso
INSERT INTO projects (
    id, client_id, name, description, type, complexity, status,
    estimated_price, currency,
    estimated_duration_days, progress_percentage, current_phase,
    tech_stack, ai_generated, started_at
) VALUES (
    uuid_generate_v4(),
    admin_user_id,
    'SaaS - Gestión de Inventarios',
    'Plataforma SaaS completa para gestión de inventarios con multi-tenancy, dashboard analytics, y facturación automática.',
    'saas',
    'complex',
    'in_progress',
    8500, 'USD',
    45, 35, 'Development',
    ARRAY['Next.js', 'React', 'Supabase', 'Stripe', 'TailwindCSS', 'Prisma'],
    true,
    NOW() - INTERVAL '10 days'
) RETURNING id INTO project_saas_id;

-- =============================================
-- 3. CREAR COTIZACIÓN PARA PROYECTO SAAS
-- =============================================
INSERT INTO quotations (
    project_id, version, items, subtotal, discount_percentage,
    tax_percentage, tax_amount, total, currency, status, valid_until
) VALUES (
    project_saas_id,
    1,
    '[
        {"description": "Diseño UI/UX", "quantity": 1, "unit_price": 1500, "total": 1500},
        {"description": "Desarrollo Frontend", "quantity": 1, "unit_price": 2500, "total": 2500},
        {"description": "Desarrollo Backend", "quantity": 1, "unit_price": 2500, "total": 2500},
        {"description": "Integración Stripe", "quantity": 1, "unit_price": 800, "total": 800},
        {"description": "Dashboard Analytics", "quantity": 1, "unit_price": 1200, "total": 1200}
    ]'::jsonb,
    8500,
    0,
    0,
    0,
    8500,
    'USD',
    'accepted',
    NOW() + INTERVAL '30 days'
) RETURNING id INTO quotation_id;

-- =============================================
-- 4. CREAR PAGOS
-- =============================================

-- Pago completo del proyecto demo
INSERT INTO payments (project_id, client_id, amount, currency, status, payment_type, paid_at)
VALUES (project_demo_id, admin_user_id, 500, 'USD', 'completed', 'full', NOW() - INTERVAL '30 days');

-- Anticipo del proyecto SaaS (50%)
INSERT INTO payments (project_id, client_id, amount, currency, status, payment_type, paid_at)
VALUES (project_saas_id, admin_user_id, 4250, 'USD', 'completed', 'deposit', NOW() - INTERVAL '10 days');

-- =============================================
-- 5. CREAR MILESTONES PARA PROYECTO SAAS
-- =============================================
INSERT INTO milestones (project_id, name, description, "order", status, progress_percentage, due_date) VALUES
(project_saas_id, 'Diseño y Prototipo', 'Wireframes, diseño UI/UX, prototipo interactivo', 1, 'completed', 100, NOW() - INTERVAL '5 days'),
(project_saas_id, 'Autenticación y Multi-tenancy', 'Sistema de auth, roles, organizaciones', 2, 'completed', 100, NOW()),
(project_saas_id, 'CRUD Inventarios', 'Módulo principal de gestión de productos', 3, 'in_progress', 60, NOW() + INTERVAL '7 days'),
(project_saas_id, 'Dashboard y Analytics', 'Reportes, gráficos, exportación', 4, 'pending', 0, NOW() + INTERVAL '14 days'),
(project_saas_id, 'Facturación y Stripe', 'Subscripciones, pagos, facturas', 5, 'pending', 0, NOW() + INTERVAL '21 days'),
(project_saas_id, 'Testing y Deploy', 'QA, optimización, deploy a producción', 6, 'pending', 0, NOW() + INTERVAL '28 days');

-- =============================================
-- 6. CREAR EQUIPO FICTICIO PARA PROYECTO SAAS
-- =============================================
INSERT INTO project_team_members (
    project_id, display_name, avatar_url, role, title,
    specializations, bio, internal_code, is_active
) VALUES
(project_saas_id, 'María González', 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria-pm', 'project_manager', 'Project Manager',
 ARRAY['Project Management', 'Agile/Scrum', 'Client Communication'],
 'Project Manager con 10 años en la industria tech. Especialista en proyectos de alta complejidad.', 'PM-2024-0001', true),

(project_saas_id, 'Carlos Mendoza', 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos-sr', 'senior_developer', 'Senior Full-Stack Developer',
 ARRAY['Next.js', 'React', 'Node.js', 'PostgreSQL'],
 'Senior Full-Stack Developer con enfoque en TypeScript y arquitecturas escalables.', 'SR-2024-0001', true),

(project_saas_id, 'Ana Rodríguez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=ana-jr1', 'junior_developer', 'Junior Developer',
 ARRAY['React', 'TailwindCSS', 'TypeScript'],
 'Frontend Developer con experiencia en React y diseño responsive.', 'JR-2024-0001', true),

(project_saas_id, 'Luis Hernández', 'https://api.dicebear.com/7.x/avataaars/svg?seed=luis-jr2', 'junior_developer', 'Junior Developer',
 ARRAY['Node.js', 'PostgreSQL', 'APIs'],
 'Backend Developer junior con experiencia en Node.js y bases de datos.', 'JR-2024-0002', true),

(project_saas_id, 'Sofia Torres', 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia-jr3', 'junior_developer', 'Junior Developer',
 ARRAY['Supabase', 'Authentication', 'Testing'],
 'Desarrolladora con enfoque en Supabase y testing automatizado.', 'JR-2024-0003', true),

(project_saas_id, 'Diego Ramírez', 'https://api.dicebear.com/7.x/avataaars/svg?seed=diego-jr4', 'junior_developer', 'Junior Developer',
 ARRAY['Stripe', 'Payments', 'Integrations'],
 'Desarrollador especializado en integraciones de pago y APIs externas.', 'JR-2024-0004', true);

-- =============================================
-- 7. CREAR NOTIFICACIONES
-- =============================================
INSERT INTO notifications (user_id, title, content, message, type, data, read) VALUES
(admin_user_id, '¡Bienvenido a Devvy!', 'Tu cuenta ha sido configurada correctamente. Explora el dashboard para comenzar.', 'Tu cuenta ha sido configurada correctamente. Explora el dashboard para comenzar.', 'info', '{"action": "welcome"}'::jsonb, false),
(admin_user_id, 'Proyecto completado', 'El proyecto "Landing Page - TechStartup" ha sido desplegado exitosamente.', 'El proyecto "Landing Page - TechStartup" ha sido desplegado exitosamente.', 'project', jsonb_build_object('projectId', project_demo_id), true),
(admin_user_id, 'Equipo asignado', 'Un equipo de 6 profesionales ha sido asignado al proyecto "SaaS - Gestión de Inventarios".', 'Un equipo de 6 profesionales ha sido asignado al proyecto "SaaS - Gestión de Inventarios".', 'project', jsonb_build_object('projectId', project_saas_id, 'teamSize', 6), false),
(admin_user_id, 'Milestone completado', 'El milestone "Autenticación y Multi-tenancy" ha sido completado.', 'El milestone "Autenticación y Multi-tenancy" ha sido completado.', 'project', jsonb_build_object('projectId', project_saas_id), false);

-- =============================================
-- 8. LOG DE ACTIVIDAD
-- =============================================
INSERT INTO activity_logs (user_id, project_id, action, details) VALUES
(admin_user_id, project_demo_id, 'project_created', '{"type": "landing_page"}'),
(admin_user_id, project_demo_id, 'payment_completed', '{"amount": 500, "currency": "USD"}'),
(admin_user_id, project_demo_id, 'project_completed', '{"deployment_url": "https://techstartup-demo.vercel.app"}'),
(admin_user_id, project_saas_id, 'project_created', '{"type": "saas"}'),
(admin_user_id, project_saas_id, 'payment_completed', '{"amount": 4250, "currency": "USD", "type": "deposit"}'),
(admin_user_id, project_saas_id, 'team_assigned', '{"team_size": 6}');

RAISE NOTICE 'Seed completado exitosamente!';
RAISE NOTICE 'Proyecto Demo ID: %', project_demo_id;
RAISE NOTICE 'Proyecto SaaS ID: %', project_saas_id;

END $$;
