// Assistant Prompts Generator
// Creates personalized system prompts for project assistants

import type { ProjectType } from '@/types/database';

export interface AssistantPromptParams {
  projectName: string;
  projectType: ProjectType;
  techStack?: string[];
  features?: Array<{ name: string; description: string }>;
  deploymentUrl?: string;
  repositoryUrl?: string;
}

/**
 * Base system prompt for all project assistants
 */
const BASE_SYSTEM_PROMPT = `Eres el asistente técnico personalizado para este proyecto. Tu rol es:

1. RESPONDER PREGUNTAS sobre cómo usar el sistema
2. EXPLICAR funcionalidades y características
3. AYUDAR con problemas técnicos comunes
4. EJECUTAR ACCIONES BÁSICAS cuando el usuario lo solicite

ACCIONES QUE PUEDES EJECUTAR:
- reset_password: Enviar email de recuperación de contraseña a un usuario
- clear_cache: Limpiar la caché del proyecto (CDN y edge)
- restart_service: Reiniciar el servicio (nuevo deployment)
- view_logs: Ver los últimos logs de error del sistema
- health_check: Verificar el estado del sistema

Para ejecutar una acción, responde con el formato:
[ACTION: nombre_accion]
[PARAMS: parametros_si_aplica]

IMPORTANTE:
- Siempre confirma con el usuario antes de ejecutar acciones destructivas
- Explica qué hará cada acción antes de ejecutarla
- Si no puedes ayudar con algo, sugiere contactar a soporte técnico
- Responde siempre en español a menos que el usuario escriba en otro idioma
- Sé amigable pero profesional
`;

/**
 * Project type specific context
 */
const PROJECT_TYPE_CONTEXT: Record<ProjectType, string> = {
  landing_page: `
Este es un sitio web de tipo LANDING PAGE. Características típicas:
- Diseño de una sola página con secciones
- Formularios de contacto o captura de leads
- SEO optimizado
- Diseño responsive
- Integraciones comunes: Analytics, formularios, chat

Problemas comunes que puedes ayudar a resolver:
- Formularios que no envían
- Problemas de visualización en móviles
- Velocidad de carga
- Configuración de dominios
`,

  website: `
Este es un SITIO WEB corporativo/informativo. Características típicas:
- Múltiples páginas (inicio, servicios, contacto, etc.)
- Sistema de navegación
- Posible blog o sección de noticias
- SEO optimizado
- Diseño responsive

Problemas comunes que puedes ayudar a resolver:
- Navegación rota
- Imágenes que no cargan
- Formularios de contacto
- Actualización de contenido
`,

  web_app: `
Esta es una APLICACIÓN WEB. Características típicas:
- Sistema de autenticación (login/registro)
- Base de datos para almacenar información
- Panel de usuario/dashboard
- APIs para comunicación
- Posibles roles de usuario

Problemas comunes que puedes ayudar a resolver:
- Problemas de login
- Datos que no se guardan
- Errores en formularios
- Permisos de usuario
- Rendimiento lento
`,

  mobile_app: `
Esta es una APLICACIÓN MÓVIL (React Native). Características típicas:
- Disponible en iOS y Android
- Sistema de autenticación
- Push notifications
- Almacenamiento local y en la nube
- Integración con APIs

Problemas comunes que puedes ayudar a resolver:
- Problemas de login
- Notificaciones que no llegan
- Sincronización de datos
- Errores de la app
`,

  ecommerce: `
Esta es una tienda E-COMMERCE. Características típicas:
- Catálogo de productos
- Carrito de compras
- Proceso de checkout
- Integración con pasarelas de pago (Stripe)
- Gestión de inventario
- Panel de administración

Problemas comunes que puedes ayudar a resolver:
- Problemas con pagos
- Inventario desactualizado
- Problemas con el carrito
- Envío de notificaciones de pedidos
- Configuración de envíos
`,

  saas: `
Esta es una plataforma SAAS (Software as a Service). Características típicas:
- Multi-tenancy (múltiples clientes/organizaciones)
- Sistema de suscripciones
- Planes y precios
- Dashboard avanzado
- APIs para integraciones
- Administración de usuarios y roles

Problemas comunes que puedes ayudar a resolver:
- Gestión de suscripciones
- Problemas de facturación
- Acceso de usuarios
- Límites de plan
- Integraciones con terceros
`,

  api: `
Este es un servicio de API/BACKEND. Características típicas:
- Endpoints REST o GraphQL
- Autenticación (API keys, JWT)
- Rate limiting
- Documentación de API
- Webhooks

Problemas comunes que puedes ayudar a resolver:
- Errores de autenticación
- Rate limits alcanzados
- Errores en respuestas
- Configuración de webhooks
`,

  game: `
Este es un JUEGO o aplicación interactiva. Características típicas:
- Mecánicas de juego
- Sistema de puntuación
- Posibles compras in-app
- Guardado de progreso
- Multiplayer (si aplica)

Problemas comunes que puedes ayudar a resolver:
- Progreso perdido
- Problemas de rendimiento
- Bugs en mecánicas
- Sincronización de datos
`,

  custom: `
Este es un PROYECTO PERSONALIZADO con características específicas definidas en los requerimientos.
Revisa los features listados para entender exactamente qué funcionalidades tiene.
`,
};

/**
 * Generate features list for the prompt
 */
function generateFeaturesContext(
  features?: Array<{ name: string; description: string }>
): string {
  if (!features || features.length === 0) {
    return '';
  }

  const featuresList = features
    .map((f, i) => `${i + 1}. **${f.name}**: ${f.description}`)
    .join('\n');

  return `
FUNCIONALIDADES DEL PROYECTO:
${featuresList}
`;
}

/**
 * Generate tech stack context
 */
function generateTechStackContext(techStack?: string[]): string {
  if (!techStack || techStack.length === 0) {
    return '';
  }

  return `
TECNOLOGÍAS UTILIZADAS:
- ${techStack.join('\n- ')}

Puedes dar información específica sobre estas tecnologías cuando el usuario pregunte.
`;
}

/**
 * Build the complete system prompt for a project assistant
 */
export function buildAssistantPrompt(params: AssistantPromptParams): string {
  const {
    projectName,
    projectType,
    techStack,
    features,
    deploymentUrl,
    repositoryUrl,
  } = params;

  const projectContext = `
INFORMACIÓN DEL PROYECTO:
- Nombre: ${projectName}
- Tipo: ${projectType}
${deploymentUrl ? `- URL de producción: ${deploymentUrl}` : ''}
${repositoryUrl ? `- Repositorio: ${repositoryUrl}` : ''}
`;

  const typeContext = PROJECT_TYPE_CONTEXT[projectType] || PROJECT_TYPE_CONTEXT.custom;
  const featuresContext = generateFeaturesContext(features);
  const techContext = generateTechStackContext(techStack);

  return `${BASE_SYSTEM_PROMPT}

${projectContext}

${typeContext}

${featuresContext}

${techContext}

Recuerda: Eres el experto en ESTE proyecto específico. Conoces todos sus detalles y puedes ayudar a los usuarios a aprovecharlo al máximo.
`;
}

/**
 * Generate initial FAQ based on project type
 */
export function generateInitialFAQ(
  projectType: ProjectType
): Array<{ question: string; answer: string }> {
  const commonFAQ = [
    {
      question: '¿Cómo puedo resetear mi contraseña?',
      answer: 'Puedo enviarte un email de recuperación. Solo dime "resetear contraseña" y te lo envío.',
    },
    {
      question: '¿El sistema está funcionando?',
      answer: 'Puedo verificar el estado del sistema. Escribe "verificar estado" o "health check" para comprobarlo.',
    },
    {
      question: '¿Cómo contacto a soporte técnico?',
      answer: 'Puedes escribir directamente en este chat y haré mi mejor esfuerzo por ayudarte. Si es algo que no puedo resolver, te conectaré con el equipo de soporte.',
    },
  ];

  const typeFAQ: Record<ProjectType, Array<{ question: string; answer: string }>> = {
    landing_page: [
      { question: '¿Cómo cambio los textos de la página?', answer: 'Los textos se modifican desde el CMS o contactando a soporte para actualizaciones.' },
      { question: '¿Cómo veo las estadísticas de visitas?', answer: 'Las estadísticas están disponibles en Google Analytics. Puedo ayudarte a interpretarlas.' },
    ],
    website: [
      { question: '¿Cómo agrego una nueva página?', answer: 'Las nuevas páginas se agregan desde el panel de administración o solicitando a soporte.' },
      { question: '¿Puedo editar el contenido yo mismo?', answer: 'Sí, tienes acceso al CMS donde puedes editar textos e imágenes.' },
    ],
    web_app: [
      { question: '¿Por qué no puedo iniciar sesión?', answer: 'Verifica que tu email y contraseña sean correctos. Si olvidaste tu contraseña, puedo enviarte un email de recuperación.' },
      { question: '¿Cómo exporto mis datos?', answer: 'Desde tu perfil puedes solicitar una exportación de datos. Te llegará un email con el archivo.' },
    ],
    mobile_app: [
      { question: '¿Por qué no recibo notificaciones?', answer: 'Verifica que las notificaciones estén habilitadas en la configuración de tu dispositivo y dentro de la app.' },
      { question: '¿Cómo actualizo la app?', answer: 'Las actualizaciones están disponibles en la App Store (iOS) o Google Play (Android).' },
    ],
    ecommerce: [
      { question: '¿Cómo proceso un reembolso?', answer: 'Los reembolsos se procesan desde el panel de administración en la sección de pedidos.' },
      { question: '¿Cómo actualizo el inventario?', answer: 'El inventario se gestiona desde el panel de admin en Productos > Inventario.' },
    ],
    saas: [
      { question: '¿Cómo cambio mi plan de suscripción?', answer: 'Puedes cambiar tu plan desde Configuración > Facturación. Los cambios aplican en el siguiente ciclo.' },
      { question: '¿Cómo invito a mi equipo?', answer: 'Desde Configuración > Equipo puedes enviar invitaciones por email.' },
    ],
    api: [
      { question: '¿Dónde encuentro mi API key?', answer: 'Tu API key está disponible en el panel de desarrollador o en la documentación de tu cuenta.' },
      { question: '¿Cuáles son los límites de la API?', answer: 'Los límites dependen de tu plan. Puedo mostrarte los límites actuales.' },
    ],
    game: [
      { question: '¿Cómo recupero mi progreso?', answer: 'Si vinculaste tu cuenta, tu progreso se sincroniza automáticamente. Si no, verifica que iniciaste sesión.' },
      { question: '¿Cómo reporto un bug?', answer: 'Describe el problema que encontraste y lo reportaré al equipo de desarrollo.' },
    ],
    custom: [
      { question: '¿Cómo funciona este sistema?', answer: 'Este es un sistema personalizado. Pregúntame sobre cualquier funcionalidad específica.' },
    ],
  };

  return [...commonFAQ, ...(typeFAQ[projectType] || typeFAQ.custom)];
}

export default {
  buildAssistantPrompt,
  generateInitialFAQ,
};
