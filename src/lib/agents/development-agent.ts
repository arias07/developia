// ============================================
// AGENTE DE DESARROLLO AUTÓNOMO
// ============================================
// Orquesta todo el proceso de desarrollo de un proyecto

import { GitHubClient, initializeProjectRepo } from '@/lib/integrations/github';
import { VercelClient, deployProjectFromGitHub } from '@/lib/integrations/vercel';
import {
  generateSupabaseConfig,
  generateTypeScriptTypes,
  generateSeedData,
  type SupabaseProjectConfig,
} from '@/lib/integrations/supabase-generator';
import { generateProjectStructure, generateComponent } from '@/lib/claude/code-generator';
import { sendNotification } from '@/lib/notifications/send';
import { EscalationManager } from '@/lib/escalation/escalation-manager';
import { createProjectAssistant } from '@/lib/assistants/project-assistant-generator';
import { createClient } from '@supabase/supabase-js';
import type { ProjectRequirements, Project } from '@/types/database';

// Supabase client for fetching project data
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================
// TIPOS
// ============================================

export type DevelopmentPhase =
  | 'initializing'
  | 'generating_structure'
  | 'generating_backend'
  | 'generating_frontend'
  | 'creating_repository'
  | 'deploying'
  | 'configuring_database'
  | 'completed'
  | 'failed';

export interface DevelopmentProgress {
  phase: DevelopmentPhase;
  progress: number; // 0-100
  message: string;
  details?: string;
  timestamp: Date;
}

export interface DevelopmentResult {
  success: boolean;
  projectId: string;
  repositoryUrl?: string;
  deploymentUrl?: string;
  supabaseConfig?: SupabaseProjectConfig;
  generatedFiles: string[];
  errors: string[];
  timeline: DevelopmentProgress[];
}

export interface DevelopmentConfig {
  projectId: string;
  userId: string;
  requirements: Partial<ProjectRequirements>;
  options: {
    createGitHubRepo: boolean;
    deployToVercel: boolean;
    generateSupabase: boolean;
    sendNotifications: boolean;
  };
}

// ============================================
// CLASE PRINCIPAL DEL AGENTE
// ============================================

export class DevelopmentAgent {
  private config: DevelopmentConfig;
  private timeline: DevelopmentProgress[] = [];
  private generatedFiles: string[] = [];
  private errors: string[] = [];

  constructor(config: DevelopmentConfig) {
    this.config = config;
  }

  // ============================================
  // MÉTODO PRINCIPAL - EJECUTAR DESARROLLO
  // ============================================

  async execute(): Promise<DevelopmentResult> {
    const result: DevelopmentResult = {
      success: false,
      projectId: this.config.projectId,
      generatedFiles: [],
      errors: [],
      timeline: [],
    };

    try {
      // Fase 1: Inicialización
      await this.updateProgress('initializing', 5, 'Inicializando proyecto...');

      // Fase 2: Generar estructura del proyecto
      await this.updateProgress('generating_structure', 10, 'Generando estructura del proyecto...');
      const projectStructure = await this.generateProjectStructure();

      // Fase 3: Generar backend (Supabase)
      let supabaseConfig: SupabaseProjectConfig | undefined;
      if (this.config.options.generateSupabase) {
        await this.updateProgress('generating_backend', 25, 'Generando backend con Supabase...');
        supabaseConfig = await this.generateBackend();
        result.supabaseConfig = supabaseConfig;
      }

      // Fase 4: Generar frontend
      await this.updateProgress('generating_frontend', 40, 'Generando componentes frontend...');
      await this.generateFrontend(projectStructure);

      // Fase 5: Crear repositorio GitHub
      let repositoryUrl: string | undefined;
      if (this.config.options.createGitHubRepo) {
        await this.updateProgress('creating_repository', 60, 'Creando repositorio en GitHub...');
        repositoryUrl = await this.createRepository(supabaseConfig);
        result.repositoryUrl = repositoryUrl;
      }

      // Fase 6: Deploy a Vercel
      let deploymentUrl: string | undefined;
      if (this.config.options.deployToVercel && repositoryUrl) {
        await this.updateProgress('deploying', 80, 'Desplegando en Vercel...');
        deploymentUrl = await this.deployToVercel(repositoryUrl);
        result.deploymentUrl = deploymentUrl;
      }

      // Fase 7: Completado
      await this.updateProgress('completed', 100, '¡Proyecto completado exitosamente!');

      result.success = true;
      result.generatedFiles = this.generatedFiles;
      result.timeline = this.timeline;

      // Notificar al usuario
      if (this.config.options.sendNotifications) {
        await this.sendCompletionNotification(result);
      }

      // Create personalized assistant for the project
      try {
        const supabase = getSupabase();
        const { data: projectData } = await supabase
          .from('projects')
          .select('*')
          .eq('id', this.config.projectId)
          .single();

        if (projectData) {
          await createProjectAssistant({
            projectId: this.config.projectId,
            projectData: projectData as Project,
            generatedFiles: this.generatedFiles,
            deploymentUrl: result.deploymentUrl,
            repositoryUrl: result.repositoryUrl,
          });
          console.log(`[DevelopmentAgent] Assistant created for project ${this.config.projectId}`);
        }
      } catch (assistantError) {
        console.error('[DevelopmentAgent] Failed to create assistant:', assistantError);
        // Don't fail the whole process if assistant creation fails
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.errors.push(errorMessage);

      // Get current phase from timeline
      const currentPhase = this.timeline.length > 0
        ? this.timeline[this.timeline.length - 1].phase
        : 'initializing';

      await this.updateProgress('failed', 0, `Error: ${errorMessage}`);

      result.errors = this.errors;
      result.timeline = this.timeline;

      // Notificar error
      if (this.config.options.sendNotifications) {
        await this.sendErrorNotification(errorMessage);
      }

      // Create escalation for human intervention
      try {
        await EscalationManager.handleFailure(
          this.config.projectId,
          error instanceof Error ? error : new Error(errorMessage),
          currentPhase,
          1 // AI attempt count
        );
        console.log(`[DevelopmentAgent] Escalation created for project ${this.config.projectId}`);
      } catch (escalationError) {
        console.error('[DevelopmentAgent] Failed to create escalation:', escalationError);
      }

      return result;
    }
  }

  // ============================================
  // MÉTODOS DE GENERACIÓN
  // ============================================

  private async generateProjectStructure() {
    const structure = await generateProjectStructure(this.config.requirements);

    // Registrar archivos generados
    for (const file of structure.files) {
      this.generatedFiles.push(file.path);
    }

    await this.updateProgress(
      'generating_structure',
      20,
      `Estructura generada: ${structure.files.length} archivos`
    );

    return structure;
  }

  private async generateBackend(): Promise<SupabaseProjectConfig> {
    // Generar configuración de Supabase
    const supabaseConfig = await generateSupabaseConfig(this.config.requirements);

    // Generar tipos TypeScript
    const types = generateTypeScriptTypes(supabaseConfig.schema);
    this.generatedFiles.push('src/types/database.generated.ts');

    // Generar seed data
    const seedData = await generateSeedData(supabaseConfig.schema, this.config.requirements);
    this.generatedFiles.push('supabase/seed.sql');

    await this.updateProgress(
      'generating_backend',
      35,
      `Backend generado: ${supabaseConfig.schema.tables.length} tablas, ${supabaseConfig.edgeFunctions.length} Edge Functions`
    );

    return supabaseConfig;
  }

  private async generateFrontend(projectStructure: Awaited<ReturnType<typeof generateProjectStructure>>) {
    const componentCount = projectStructure.files.filter((f) => f.path.includes('/components/')).length;

    // Generar componentes adicionales basados en el proyecto
    const additionalComponents = await this.generateAdditionalComponents();

    await this.updateProgress(
      'generating_frontend',
      55,
      `Frontend generado: ${componentCount + additionalComponents} componentes`
    );

    return componentCount + additionalComponents;
  }

  private async generateAdditionalComponents(): Promise<number> {
    const components = [];

    // Determinar qué componentes adicionales necesitamos
    const projectType = this.config.requirements.project_type;

    if (projectType === 'ecommerce') {
      components.push(
        { name: 'ProductCard', description: 'Card de producto con imagen, precio y botón de compra' },
        { name: 'ShoppingCart', description: 'Carrito de compras con lista de productos' },
        { name: 'CheckoutForm', description: 'Formulario de checkout con integración de pago' }
      );
    } else if (projectType === 'saas') {
      components.push(
        { name: 'PricingTable', description: 'Tabla de precios con planes' },
        { name: 'FeatureList', description: 'Lista de características del producto' },
        { name: 'DashboardLayout', description: 'Layout principal del dashboard' }
      );
    } else if (projectType === 'web_app') {
      components.push(
        { name: 'DataTable', description: 'Tabla de datos con sorting y paginación' },
        { name: 'FormBuilder', description: 'Constructor de formularios dinámicos' }
      );
    }

    // Generar cada componente
    for (const comp of components) {
      try {
        await generateComponent({
          name: comp.name,
          type: 'component',
          description: comp.description,
          props: [],
        });
        this.generatedFiles.push(`src/components/${comp.name}.tsx`);
      } catch (error) {
        console.error(`Error generating component ${comp.name}:`, error);
      }
    }

    return components.length;
  }

  // ============================================
  // MÉTODOS DE INFRAESTRUCTURA
  // ============================================

  private async createRepository(supabaseConfig?: SupabaseProjectConfig): Promise<string> {
    const github = new GitHubClient();
    const projectName = this.sanitizeProjectName(this.config.requirements.project_name || 'proyecto');

    // Preparar archivos para el commit inicial
    const files = await this.prepareRepositoryFiles(supabaseConfig);

    // Crear repositorio y subir archivos
    const result = await initializeProjectRepo(
      projectName,
      `Proyecto generado por Devvy: ${this.config.requirements.project_description || ''}`,
      files
    );

    const repoUrl = result.repo.html_url;

    await this.updateProgress(
      'creating_repository',
      75,
      `Repositorio creado: ${repoUrl}`
    );

    return repoUrl;
  }

  private async prepareRepositoryFiles(supabaseConfig?: SupabaseProjectConfig) {
    const files: Array<{ path: string; content: string }> = [];

    // package.json
    files.push({
      path: 'package.json',
      content: this.generatePackageJson(),
    });

    // README.md
    files.push({
      path: 'README.md',
      content: this.generateReadme(),
    });

    // .env.example
    files.push({
      path: '.env.example',
      content: this.generateEnvExample(),
    });

    // .gitignore
    files.push({
      path: '.gitignore',
      content: this.generateGitignore(),
    });

    // next.config.js
    files.push({
      path: 'next.config.js',
      content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
`,
    });

    // tailwind.config.ts
    files.push({
      path: 'tailwind.config.ts',
      content: this.generateTailwindConfig(),
    });

    // Supabase files si aplica
    if (supabaseConfig) {
      files.push({
        path: 'supabase/migrations/001_initial_schema.sql',
        content: supabaseConfig.schema.sql,
      });

      files.push({
        path: 'supabase/storage-rules.sql',
        content: supabaseConfig.storageRules,
      });

      files.push({
        path: 'src/types/database.generated.ts',
        content: generateTypeScriptTypes(supabaseConfig.schema),
      });

      // Edge Functions
      for (const fn of supabaseConfig.edgeFunctions) {
        files.push({
          path: `supabase/functions/${fn.name}/index.ts`,
          content: fn.code,
        });
      }
    }

    return files;
  }

  private async deployToVercel(repositoryUrl: string): Promise<string> {
    const projectName = this.sanitizeProjectName(this.config.requirements.project_name || 'proyecto');

    // Extraer owner/repo de la URL
    const repoMatch = repositoryUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!repoMatch) {
      throw new Error('URL de repositorio inválida');
    }

    const [, owner, repo] = repoMatch;

    // Desplegar
    const result = await deployProjectFromGitHub({
      projectName,
      githubRepo: `${owner}/${repo.replace('.git', '')}`,
      framework: 'nextjs',
    });

    await this.updateProgress('deploying', 95, `Desplegado: ${result.deploymentUrl}`);

    return result.deploymentUrl;
  }

  // ============================================
  // HELPERS
  // ============================================

  private sanitizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }

  private async updateProgress(
    phase: DevelopmentPhase,
    progress: number,
    message: string,
    details?: string
  ) {
    const progressEntry: DevelopmentProgress = {
      phase,
      progress,
      message,
      details,
      timestamp: new Date(),
    };

    this.timeline.push(progressEntry);

    // Enviar notificación de progreso si está habilitado
    if (this.config.options.sendNotifications && progress % 20 === 0) {
      await sendNotification({
        userId: this.config.userId,
        title: 'Progreso del Desarrollo',
        message: message,
        type: 'info',
        data: { projectId: this.config.projectId, progress },
      });
    }
  }

  private async sendCompletionNotification(result: DevelopmentResult) {
    await sendNotification({
      userId: this.config.userId,
      title: '¡Proyecto Completado!',
      message: `Tu proyecto ha sido generado exitosamente. ${result.deploymentUrl ? `Ya está en línea: ${result.deploymentUrl}` : ''}`,
      type: 'project',
      data: {
        projectId: this.config.projectId,
        repositoryUrl: result.repositoryUrl,
        deploymentUrl: result.deploymentUrl,
      },
    });
  }

  private async sendErrorNotification(error: string) {
    await sendNotification({
      userId: this.config.userId,
      title: 'Error en el Desarrollo',
      message: `Hubo un problema generando tu proyecto: ${error}`,
      type: 'alert',
      data: { projectId: this.config.projectId },
    });
  }

  // ============================================
  // GENERADORES DE ARCHIVOS BASE
  // ============================================

  private generatePackageJson(): string {
    const projectName = this.sanitizeProjectName(
      this.config.requirements.project_name || 'proyecto'
    );

    return JSON.stringify(
      {
        name: projectName,
        version: '0.1.0',
        private: true,
        scripts: {
          dev: 'next dev',
          build: 'next build',
          start: 'next start',
          lint: 'next lint',
        },
        dependencies: {
          next: '^14.0.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          '@supabase/supabase-js': '^2.39.0',
          '@supabase/ssr': '^0.1.0',
          'class-variance-authority': '^0.7.0',
          clsx: '^2.0.0',
          'lucide-react': '^0.303.0',
          'tailwind-merge': '^2.2.0',
          zustand: '^4.4.7',
        },
        devDependencies: {
          '@types/node': '^20.10.0',
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          autoprefixer: '^10.4.16',
          eslint: '^8.56.0',
          'eslint-config-next': '^14.0.0',
          postcss: '^8.4.32',
          tailwindcss: '^3.4.0',
          typescript: '^5.3.0',
        },
      },
      null,
      2
    );
  }

  private generateReadme(): string {
    const name = this.config.requirements.project_name || 'Proyecto';
    const description = this.config.requirements.project_description || '';

    return `# ${name}

${description}

## 🚀 Generado con Devvy

Este proyecto fue generado automáticamente por [Devvy](https://devvy.tech).

## Tecnologías

- **Frontend:** Next.js 14, React 18, TailwindCSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Lenguaje:** TypeScript

## Comenzar

\`\`\`bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
npm run dev
\`\`\`

## Estructura del Proyecto

\`\`\`
├── src/
│   ├── app/          # App Router de Next.js
│   ├── components/   # Componentes React
│   ├── lib/          # Utilidades y clientes
│   ├── stores/       # Estado global (Zustand)
│   └── types/        # Tipos TypeScript
├── supabase/
│   ├── migrations/   # Migraciones SQL
│   └── functions/    # Edge Functions
└── public/           # Archivos estáticos
\`\`\`

## Base de Datos

Ejecutar migraciones en Supabase:

\`\`\`bash
# En el dashboard de Supabase, ir a SQL Editor
# Ejecutar el contenido de supabase/migrations/001_initial_schema.sql
\`\`\`

---

Generado con ❤️ por Devvy
`;
  }

  private generateEnvExample(): string {
    return `# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
`;
  }

  private generateGitignore(): string {
    return `# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;
  }

  private generateTailwindConfig(): string {
    return `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
    },
  },
  plugins: [],
}

export default config
`;
  }
}

// ============================================
// FUNCIÓN HELPER PARA EJECUTAR DESARROLLO
// ============================================

export async function developProject(config: DevelopmentConfig): Promise<DevelopmentResult> {
  const agent = new DevelopmentAgent(config);
  return agent.execute();
}
