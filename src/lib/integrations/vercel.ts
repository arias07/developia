// ============================================
// VERCEL API INTEGRATION
// ============================================

interface VercelConfig {
  token: string;
  teamId?: string;
}

interface CreateProjectOptions {
  name: string;
  framework?: 'nextjs' | 'vite' | 'remix' | 'nuxt' | 'svelte' | 'static';
  gitRepository?: {
    type: 'github';
    repo: string; // owner/repo format
  };
  environmentVariables?: Array<{
    key: string;
    value: string;
    target: ('production' | 'preview' | 'development')[];
  }>;
}

interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  link?: {
    type: string;
    repo: string;
    repoId: number;
  };
}

interface VercelDeployment {
  id: string;
  url: string;
  state: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  readyState: string;
  createdAt: number;
  buildingAt?: number;
  ready?: number;
}

interface DeploymentStatus {
  id: string;
  state: string;
  url: string | null;
  errorMessage?: string;
}

export class VercelClient {
  private baseUrl = 'https://api.vercel.com';
  private token: string;
  private teamId?: string;

  constructor(config?: Partial<VercelConfig>) {
    this.token = config?.token || process.env.VERCEL_TOKEN || '';
    this.teamId = config?.teamId || process.env.VERCEL_TEAM_ID;

    if (!this.token) {
      throw new Error('VERCEL_TOKEN is required');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (this.teamId) {
      url.searchParams.set('teamId', this.teamId);
    }

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Vercel API Error: ${response.status} - ${error.error?.message || response.statusText}`
      );
    }

    return response.json();
  }

  // ============================================
  // PROYECTOS
  // ============================================

  async createProject(options: CreateProjectOptions): Promise<VercelProject> {
    const body: Record<string, unknown> = {
      name: options.name,
      framework: options.framework || 'nextjs',
    };

    if (options.gitRepository) {
      body.gitRepository = options.gitRepository;
    }

    const project = await this.request<VercelProject>('/v10/projects', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    // Add environment variables if provided
    if (options.environmentVariables && options.environmentVariables.length > 0) {
      await this.setEnvironmentVariables(project.id, options.environmentVariables);
    }

    return project;
  }

  async getProject(projectId: string): Promise<VercelProject> {
    return this.request<VercelProject>(`/v9/projects/${projectId}`);
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.request(`/v9/projects/${projectId}`, { method: 'DELETE' });
  }

  async listProjects(): Promise<VercelProject[]> {
    const response = await this.request<{ projects: VercelProject[] }>('/v9/projects');
    return response.projects;
  }

  // ============================================
  // ENVIRONMENT VARIABLES
  // ============================================

  async setEnvironmentVariables(
    projectId: string,
    envVars: Array<{
      key: string;
      value: string;
      target: ('production' | 'preview' | 'development')[];
    }>
  ): Promise<void> {
    await this.request(`/v10/projects/${projectId}/env`, {
      method: 'POST',
      body: JSON.stringify(envVars),
    });
  }

  async getEnvironmentVariables(
    projectId: string
  ): Promise<Array<{ key: string; value: string; target: string[] }>> {
    const response = await this.request<{
      envs: Array<{ key: string; value: string; target: string[] }>;
    }>(`/v9/projects/${projectId}/env`);
    return response.envs;
  }

  async deleteEnvironmentVariable(projectId: string, envId: string): Promise<void> {
    await this.request(`/v9/projects/${projectId}/env/${envId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // DEPLOYMENTS
  // ============================================

  async createDeployment(
    projectName: string,
    files: Array<{ file: string; data: string }>,
    options?: {
      target?: 'production' | 'preview';
      gitSource?: {
        type: 'github';
        ref: string;
        repoId: string;
      };
    }
  ): Promise<VercelDeployment> {
    return this.request<VercelDeployment>('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify({
        name: projectName,
        files: files.map((f) => ({
          file: f.file,
          data: Buffer.from(f.data).toString('base64'),
        })),
        target: options?.target || 'production',
        gitSource: options?.gitSource,
      }),
    });
  }

  async getDeployment(deploymentId: string): Promise<VercelDeployment> {
    return this.request<VercelDeployment>(`/v13/deployments/${deploymentId}`);
  }

  async getDeploymentStatus(deploymentId: string): Promise<DeploymentStatus> {
    const deployment = await this.getDeployment(deploymentId);

    return {
      id: deployment.id,
      state: deployment.state,
      url: deployment.state === 'READY' ? `https://${deployment.url}` : null,
      errorMessage: deployment.state === 'ERROR' ? 'Deployment failed' : undefined,
    };
  }

  async listDeployments(
    projectId?: string,
    limit: number = 10
  ): Promise<VercelDeployment[]> {
    let endpoint = `/v6/deployments?limit=${limit}`;
    if (projectId) {
      endpoint += `&projectId=${projectId}`;
    }

    const response = await this.request<{ deployments: VercelDeployment[] }>(endpoint);
    return response.deployments;
  }

  async cancelDeployment(deploymentId: string): Promise<void> {
    await this.request(`/v12/deployments/${deploymentId}/cancel`, {
      method: 'PATCH',
    });
  }

  // Trigger deployment from GitHub (si está conectado)
  async triggerDeployment(
    projectId: string,
    gitRef: string = 'main'
  ): Promise<VercelDeployment> {
    return this.request<VercelDeployment>('/v13/deployments', {
      method: 'POST',
      body: JSON.stringify({
        name: projectId,
        gitSource: {
          ref: gitRef,
          type: 'github',
        },
        target: 'production',
      }),
    });
  }

  // ============================================
  // DOMAINS
  // ============================================

  async addDomain(projectId: string, domain: string): Promise<void> {
    await this.request(`/v10/projects/${projectId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: domain }),
    });
  }

  async removeDomain(projectId: string, domain: string): Promise<void> {
    await this.request(`/v9/projects/${projectId}/domains/${domain}`, {
      method: 'DELETE',
    });
  }

  async listDomains(projectId: string): Promise<Array<{ name: string; verified: boolean }>> {
    const response = await this.request<{
      domains: Array<{ name: string; verified: boolean }>;
    }>(`/v9/projects/${projectId}/domains`);
    return response.domains;
  }

  // ============================================
  // LOGS
  // ============================================

  async getDeploymentLogs(
    deploymentId: string
  ): Promise<Array<{ timestamp: number; text: string; type: string }>> {
    const response = await this.request<{
      logs: Array<{ timestamp: number; text: string; type: string }>;
    }>(`/v2/deployments/${deploymentId}/events`);
    return response.logs || [];
  }

  // ============================================
  // UTILITY - Esperar a que el deployment esté listo
  // ============================================

  async waitForDeployment(
    deploymentId: string,
    timeoutMs: number = 300000, // 5 minutos default
    pollIntervalMs: number = 5000
  ): Promise<DeploymentStatus> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
      const status = await this.getDeploymentStatus(deploymentId);

      if (status.state === 'READY') {
        return status;
      }

      if (status.state === 'ERROR' || status.state === 'CANCELED') {
        throw new Error(`Deployment failed: ${status.errorMessage || status.state}`);
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }

    throw new Error('Deployment timed out');
  }
}

// ============================================
// FACTORY Y SINGLETON
// ============================================

let vercelClient: VercelClient | null = null;

export function getVercelClient(): VercelClient {
  if (!process.env.VERCEL_TOKEN) {
    throw new Error('VERCEL_TOKEN is not configured');
  }

  if (!vercelClient) {
    vercelClient = new VercelClient({
      token: process.env.VERCEL_TOKEN,
      teamId: process.env.VERCEL_TEAM_ID,
    });
  }

  return vercelClient;
}

// ============================================
// HELPERS PARA PROYECTOS
// ============================================

export interface DeployProjectOptions {
  projectName: string;
  githubRepo: string; // owner/repo format
  framework?: 'nextjs' | 'vite' | 'remix';
  envVars?: Record<string, string>;
}

export async function deployProjectFromGitHub(
  options: DeployProjectOptions
): Promise<{
  project: VercelProject;
  deploymentUrl: string;
}> {
  const vercel = getVercelClient();

  // Create Vercel project linked to GitHub
  const project = await vercel.createProject({
    name: options.projectName,
    framework: options.framework || 'nextjs',
    gitRepository: {
      type: 'github',
      repo: options.githubRepo,
    },
    environmentVariables: options.envVars
      ? Object.entries(options.envVars).map(([key, value]) => ({
          key,
          value,
          target: ['production', 'preview', 'development'] as const,
        }))
      : undefined,
  });

  // Get the latest deployment
  const deployments = await vercel.listDeployments(project.id, 1);

  if (deployments.length === 0) {
    throw new Error('No deployment created');
  }

  // Wait for deployment to be ready
  const status = await vercel.waitForDeployment(deployments[0].id);

  return {
    project,
    deploymentUrl: status.url!,
  };
}
