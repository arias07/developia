// Project Assistant Generator
// Creates personalized AI assistants for completed projects

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { buildAssistantPrompt, generateInitialFAQ } from './assistant-prompts';
import type { Project, ProjectAssistant, ProjectType } from '@/types/database';

// Supabase client for server-side operations
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Anthropic client
function getClaude() {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });
}

export interface CreateAssistantParams {
  projectId: string;
  projectData: Project;
  generatedFiles?: string[];
  deploymentUrl?: string;
  repositoryUrl?: string;
  vercelProjectId?: string;
  supabaseProjectRef?: string;
}

/**
 * Generate a summary of the project using Claude
 */
async function generateProjectSummary(project: Project): Promise<string> {
  const claude = getClaude();

  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Resume en 2-3 párrafos este proyecto para un asistente de soporte técnico. Incluye las funcionalidades principales y cómo usarlas.

Proyecto: ${project.name}
Tipo: ${project.type}
Descripción: ${project.description}
Stack técnico: ${project.tech_stack?.join(', ') || 'Next.js, React, Supabase'}

Requerimientos:
${JSON.stringify(project.requirements_json, null, 2)}

El resumen debe ser claro, conciso y útil para ayudar a usuarios con preguntas sobre el sistema.`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    return textContent?.text || 'Proyecto de desarrollo de software personalizado.';
  } catch (error) {
    console.error('Error generating project summary:', error);
    return `${project.name} - ${project.description || 'Proyecto de desarrollo de software.'}`;
  }
}

/**
 * Generate architecture overview
 */
async function generateArchitectureOverview(
  project: Project,
  generatedFiles?: string[]
): Promise<string> {
  const claude = getClaude();

  const filesList = generatedFiles?.slice(0, 50).join('\n') || 'No files list available';

  try {
    const response = await claude.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Describe brevemente la arquitectura de este proyecto para un asistente de soporte. Incluye las partes principales y cómo se conectan.

Proyecto: ${project.name}
Tipo: ${project.type}
Stack: ${project.tech_stack?.join(', ') || 'Next.js, React, Supabase'}

Archivos generados:
${filesList}

La descripción debe ser técnicamente precisa pero entendible.`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === 'text');
    return textContent?.text || 'Arquitectura estándar de Next.js con Supabase.';
  } catch (error) {
    console.error('Error generating architecture overview:', error);
    return 'Arquitectura basada en Next.js para el frontend y Supabase para backend y base de datos.';
  }
}

/**
 * Extract features from requirements
 */
function extractFeaturesList(
  project: Project
): Array<{ name: string; description: string }> {
  const features: Array<{ name: string; description: string }> = [];

  // Extract from core_features
  if (project.requirements_json?.core_features) {
    for (const feature of project.requirements_json.core_features) {
      features.push({
        name: feature.name,
        description: feature.description,
      });
    }
  }

  // Extract from nice_to_have_features
  if (project.requirements_json?.nice_to_have_features) {
    for (const feature of project.requirements_json.nice_to_have_features) {
      features.push({
        name: feature.name,
        description: feature.description,
      });
    }
  }

  return features;
}

/**
 * Generate API endpoints documentation (if applicable)
 */
function generateAPIEndpoints(
  projectType: ProjectType
): Array<{ method: string; path: string; description: string }> {
  // Common endpoints for web apps
  const commonEndpoints = [
    { method: 'POST', path: '/api/auth/login', description: 'Iniciar sesión' },
    { method: 'POST', path: '/api/auth/register', description: 'Registrar usuario' },
    { method: 'POST', path: '/api/auth/logout', description: 'Cerrar sesión' },
    { method: 'GET', path: '/api/user/profile', description: 'Obtener perfil del usuario' },
  ];

  // Type-specific endpoints
  const typeEndpoints: Record<ProjectType, Array<{ method: string; path: string; description: string }>> = {
    ecommerce: [
      { method: 'GET', path: '/api/products', description: 'Listar productos' },
      { method: 'GET', path: '/api/cart', description: 'Ver carrito' },
      { method: 'POST', path: '/api/checkout', description: 'Procesar compra' },
      { method: 'GET', path: '/api/orders', description: 'Ver pedidos' },
    ],
    saas: [
      { method: 'GET', path: '/api/subscription', description: 'Ver suscripción actual' },
      { method: 'POST', path: '/api/subscription/upgrade', description: 'Mejorar plan' },
      { method: 'GET', path: '/api/team', description: 'Ver miembros del equipo' },
    ],
    web_app: [
      { method: 'GET', path: '/api/dashboard', description: 'Datos del dashboard' },
      { method: 'GET', path: '/api/settings', description: 'Configuración del usuario' },
    ],
    api: [
      { method: 'GET', path: '/api/v1/resources', description: 'Listar recursos' },
      { method: 'POST', path: '/api/v1/resources', description: 'Crear recurso' },
      { method: 'GET', path: '/api/v1/resources/:id', description: 'Obtener recurso' },
    ],
    landing_page: [],
    website: [],
    mobile_app: commonEndpoints,
    game: [],
    custom: [],
  };

  if (projectType === 'landing_page' || projectType === 'website') {
    return [];
  }

  return [...commonEndpoints, ...(typeEndpoints[projectType] || [])];
}

/**
 * Create a project assistant
 */
export async function createProjectAssistant(
  params: CreateAssistantParams
): Promise<ProjectAssistant | null> {
  const supabase = getSupabase();
  const {
    projectId,
    projectData,
    generatedFiles,
    deploymentUrl,
    repositoryUrl,
    vercelProjectId,
    supabaseProjectRef,
  } = params;

  // Check if assistant already exists
  const { data: existing } = await supabase
    .from('project_assistants')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (existing) {
    console.log(`Assistant already exists for project ${projectId}`);
    return existing as ProjectAssistant;
  }

  console.log(`Creating assistant for project ${projectId}...`);

  // Generate all the assistant content
  const [summary, architecture] = await Promise.all([
    generateProjectSummary(projectData),
    generateArchitectureOverview(projectData, generatedFiles),
  ]);

  const features = extractFeaturesList(projectData);
  const faq = generateInitialFAQ(projectData.type);
  const apiEndpoints = generateAPIEndpoints(projectData.type);

  // Build the system prompt
  const systemPrompt = buildAssistantPrompt({
    projectName: projectData.name,
    projectType: projectData.type,
    techStack: projectData.tech_stack,
    features,
    deploymentUrl,
    repositoryUrl,
  });

  // Create assistant name
  const assistantName = `Asistente de ${projectData.name}`;

  // Generate avatar URL (using project name as seed)
  const avatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(projectData.name)}&backgroundColor=a855f7`;

  // Insert the assistant
  const { data: assistant, error } = await supabase
    .from('project_assistants')
    .insert({
      project_id: projectId,
      assistant_name: assistantName,
      avatar_url: avatarUrl,
      system_prompt: systemPrompt,
      model: 'claude-sonnet-4-20250514',
      temperature: 0.7,
      max_tokens: 4096,
      project_summary: summary,
      tech_stack: { stack: projectData.tech_stack || [] },
      features_list: features,
      architecture_overview: architecture,
      known_issues: [],
      faq,
      documentation_urls: repositoryUrl ? [repositoryUrl] : [],
      codebase_summary: generatedFiles
        ? `Proyecto con ${generatedFiles.length} archivos generados.`
        : null,
      api_endpoints: apiEndpoints,
      can_reset_passwords: true,
      can_clear_cache: true,
      can_restart_service: true,
      can_view_logs: true,
      can_health_check: true,
      vercel_project_id: vercelProjectId,
      supabase_project_ref: supabaseProjectRef,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating assistant:', error);
    return null;
  }

  console.log(`Assistant created for project ${projectId}: ${assistantName}`);

  // Send notification to client
  await supabase.from('notifications').insert({
    user_id: projectData.client_id,
    title: 'Tu asistente está listo',
    message: `${assistantName} está disponible 24/7 para ayudarte con tu proyecto.`,
    type: 'project',
    data: { projectId, assistantId: assistant.id },
  });

  return assistant as ProjectAssistant;
}

/**
 * Get assistant for a project
 */
export async function getProjectAssistant(
  projectId: string
): Promise<ProjectAssistant | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('project_assistants')
    .select('*')
    .eq('project_id', projectId)
    .single();

  if (error) {
    console.error('Error fetching assistant:', error);
    return null;
  }

  return data as ProjectAssistant;
}

/**
 * Update assistant knowledge (FAQ, known issues, etc.)
 */
export async function updateAssistantKnowledge(
  assistantId: string,
  updates: {
    faq?: Array<{ question: string; answer: string }>;
    known_issues?: Array<{ issue: string; workaround?: string }>;
    codebase_summary?: string;
  }
): Promise<ProjectAssistant | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('project_assistants')
    .update(updates)
    .eq('id', assistantId)
    .select()
    .single();

  if (error) {
    console.error('Error updating assistant:', error);
    return null;
  }

  return data as ProjectAssistant;
}

export default {
  createProjectAssistant,
  getProjectAssistant,
  updateAssistantKnowledge,
};
