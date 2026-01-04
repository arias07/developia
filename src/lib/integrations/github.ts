// ============================================
// GITHUB API INTEGRATION
// ============================================

interface GitHubConfig {
  token: string;
  owner: string; // Usuario u organización
}

interface CreateRepoOptions {
  name: string;
  description?: string;
  isPrivate?: boolean;
  autoInit?: boolean;
  template?: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string;
}

interface GitHubFile {
  path: string;
  content: string;
  message?: string;
}

interface CommitResult {
  sha: string;
  html_url: string;
  message: string;
}

export class GitHubClient {
  private baseUrl = 'https://api.github.com';
  private token: string;
  private owner: string;

  constructor(config?: Partial<GitHubConfig>) {
    this.token = config?.token || process.env.GITHUB_TOKEN || '';
    this.owner = config?.owner || process.env.GITHUB_OWNER || '';

    if (!this.token) {
      throw new Error('GITHUB_TOKEN is required');
    }
    if (!this.owner) {
      throw new Error('GITHUB_OWNER is required');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `GitHub API Error: ${response.status} - ${error.message || response.statusText}`
      );
    }

    return response.json();
  }

  // ============================================
  // REPOSITORIOS
  // ============================================

  async createRepository(options: CreateRepoOptions): Promise<GitHubRepo> {
    return this.request<GitHubRepo>('/user/repos', {
      method: 'POST',
      body: JSON.stringify({
        name: options.name,
        description: options.description || '',
        private: options.isPrivate ?? true,
        auto_init: options.autoInit ?? true,
      }),
    });
  }

  async getRepository(repoName: string): Promise<GitHubRepo> {
    return this.request<GitHubRepo>(`/repos/${this.owner}/${repoName}`);
  }

  async deleteRepository(repoName: string): Promise<void> {
    await this.request(`/repos/${this.owner}/${repoName}`, {
      method: 'DELETE',
    });
  }

  async createFromTemplate(
    templateOwner: string,
    templateRepo: string,
    newRepoName: string,
    description?: string
  ): Promise<GitHubRepo> {
    return this.request<GitHubRepo>(
      `/repos/${templateOwner}/${templateRepo}/generate`,
      {
        method: 'POST',
        body: JSON.stringify({
          owner: this.owner,
          name: newRepoName,
          description,
          private: true,
        }),
      }
    );
  }

  // ============================================
  // ARCHIVOS Y COMMITS
  // ============================================

  async getFileContent(
    repoName: string,
    path: string,
    branch?: string
  ): Promise<{ content: string; sha: string }> {
    const endpoint = `/repos/${this.owner}/${repoName}/contents/${path}${
      branch ? `?ref=${branch}` : ''
    }`;
    const response = await this.request<{ content: string; sha: string }>(endpoint);

    return {
      content: Buffer.from(response.content, 'base64').toString('utf-8'),
      sha: response.sha,
    };
  }

  async createOrUpdateFile(
    repoName: string,
    path: string,
    content: string,
    message: string,
    branch?: string,
    sha?: string
  ): Promise<CommitResult> {
    const response = await this.request<{ commit: { sha: string; html_url: string } }>(
      `/repos/${this.owner}/${repoName}/contents/${path}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          message,
          content: Buffer.from(content).toString('base64'),
          branch: branch || 'main',
          sha, // Required for updates
        }),
      }
    );

    return {
      sha: response.commit.sha,
      html_url: response.commit.html_url,
      message,
    };
  }

  async deleteFile(
    repoName: string,
    path: string,
    message: string,
    sha: string,
    branch?: string
  ): Promise<void> {
    await this.request(`/repos/${this.owner}/${repoName}/contents/${path}`, {
      method: 'DELETE',
      body: JSON.stringify({
        message,
        sha,
        branch: branch || 'main',
      }),
    });
  }

  // Crear múltiples archivos en un solo commit usando Git Trees
  async createMultipleFiles(
    repoName: string,
    files: GitHubFile[],
    commitMessage: string,
    branch: string = 'main'
  ): Promise<CommitResult> {
    // 1. Get the latest commit SHA
    const refResponse = await this.request<{ object: { sha: string } }>(
      `/repos/${this.owner}/${repoName}/git/ref/heads/${branch}`
    );
    const latestCommitSha = refResponse.object.sha;

    // 2. Get the tree SHA of the latest commit
    const commitResponse = await this.request<{ tree: { sha: string } }>(
      `/repos/${this.owner}/${repoName}/git/commits/${latestCommitSha}`
    );
    const baseTreeSha = commitResponse.tree.sha;

    // 3. Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const blobResponse = await this.request<{ sha: string }>(
          `/repos/${this.owner}/${repoName}/git/blobs`,
          {
            method: 'POST',
            body: JSON.stringify({
              content: file.content,
              encoding: 'utf-8',
            }),
          }
        );
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blobResponse.sha,
        };
      })
    );

    // 4. Create a new tree
    const treeResponse = await this.request<{ sha: string }>(
      `/repos/${this.owner}/${repoName}/git/trees`,
      {
        method: 'POST',
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: blobs,
        }),
      }
    );

    // 5. Create a new commit
    const newCommitResponse = await this.request<{ sha: string; html_url: string }>(
      `/repos/${this.owner}/${repoName}/git/commits`,
      {
        method: 'POST',
        body: JSON.stringify({
          message: commitMessage,
          tree: treeResponse.sha,
          parents: [latestCommitSha],
        }),
      }
    );

    // 6. Update the branch reference
    await this.request(`/repos/${this.owner}/${repoName}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommitResponse.sha,
      }),
    });

    return {
      sha: newCommitResponse.sha,
      html_url: newCommitResponse.html_url,
      message: commitMessage,
    };
  }

  // ============================================
  // BRANCHES
  // ============================================

  async createBranch(
    repoName: string,
    branchName: string,
    fromBranch: string = 'main'
  ): Promise<void> {
    // Get SHA of the source branch
    const refResponse = await this.request<{ object: { sha: string } }>(
      `/repos/${this.owner}/${repoName}/git/ref/heads/${fromBranch}`
    );

    // Create new branch
    await this.request(`/repos/${this.owner}/${repoName}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branchName}`,
        sha: refResponse.object.sha,
      }),
    });
  }

  async deleteBranch(repoName: string, branchName: string): Promise<void> {
    await this.request(
      `/repos/${this.owner}/${repoName}/git/refs/heads/${branchName}`,
      { method: 'DELETE' }
    );
  }

  // ============================================
  // PULL REQUESTS
  // ============================================

  async createPullRequest(
    repoName: string,
    title: string,
    body: string,
    head: string,
    base: string = 'main'
  ): Promise<{ number: number; html_url: string }> {
    return this.request(`/repos/${this.owner}/${repoName}/pulls`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        body,
        head,
        base,
      }),
    });
  }

  async mergePullRequest(
    repoName: string,
    pullNumber: number,
    commitMessage?: string
  ): Promise<void> {
    await this.request(`/repos/${this.owner}/${repoName}/pulls/${pullNumber}/merge`, {
      method: 'PUT',
      body: JSON.stringify({
        commit_message: commitMessage,
        merge_method: 'squash',
      }),
    });
  }

  // ============================================
  // ACTIONS / WORKFLOWS
  // ============================================

  async triggerWorkflow(
    repoName: string,
    workflowId: string,
    ref: string = 'main',
    inputs?: Record<string, string>
  ): Promise<void> {
    await this.request(
      `/repos/${this.owner}/${repoName}/actions/workflows/${workflowId}/dispatches`,
      {
        method: 'POST',
        body: JSON.stringify({
          ref,
          inputs,
        }),
      }
    );
  }

  async getWorkflowRuns(
    repoName: string,
    workflowId?: string
  ): Promise<Array<{ id: number; status: string; conclusion: string }>> {
    const endpoint = workflowId
      ? `/repos/${this.owner}/${repoName}/actions/workflows/${workflowId}/runs`
      : `/repos/${this.owner}/${repoName}/actions/runs`;

    const response = await this.request<{
      workflow_runs: Array<{ id: number; status: string; conclusion: string }>;
    }>(endpoint);

    return response.workflow_runs;
  }

  // ============================================
  // SECRETS (para variables de entorno)
  // ============================================

  async setRepositorySecret(
    repoName: string,
    secretName: string,
    secretValue: string
  ): Promise<void> {
    // Get public key for encryption
    const keyResponse = await this.request<{
      key_id: string;
      key: string;
    }>(`/repos/${this.owner}/${repoName}/actions/secrets/public-key`);

    // Encrypt the secret using libsodium (simplified - in production use proper encryption)
    // For now, we'll use the GitHub API's built-in encryption
    const encryptedValue = await this.encryptSecret(secretValue, keyResponse.key);

    await this.request(
      `/repos/${this.owner}/${repoName}/actions/secrets/${secretName}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          encrypted_value: encryptedValue,
          key_id: keyResponse.key_id,
        }),
      }
    );
  }

  private async encryptSecret(secret: string, publicKey: string): Promise<string> {
    // In a real implementation, use tweetnacl or libsodium-wrappers
    // This is a placeholder - GitHub requires sealed box encryption
    const encoder = new TextEncoder();
    const messageBytes = encoder.encode(secret);
    const keyBytes = Uint8Array.from(atob(publicKey), (c) => c.charCodeAt(0));

    // For production, implement proper NaCl sealed box encryption
    // Using crypto.subtle as a placeholder
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      await crypto.subtle.importKey(
        'spki',
        keyBytes,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        false,
        ['encrypt']
      ),
      messageBytes
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }
}

// ============================================
// FACTORY Y SINGLETON
// ============================================

let githubClient: GitHubClient | null = null;

export function getGitHubClient(): GitHubClient {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is not configured');
  }
  if (!process.env.GITHUB_OWNER) {
    throw new Error('GITHUB_OWNER is not configured');
  }

  if (!githubClient) {
    githubClient = new GitHubClient({
      token: process.env.GITHUB_TOKEN,
      owner: process.env.GITHUB_OWNER,
    });
  }

  return githubClient;
}

// ============================================
// HELPERS PARA PROYECTOS
// ============================================

export async function initializeProjectRepo(
  projectName: string,
  projectDescription: string,
  files: GitHubFile[]
): Promise<{
  repo: GitHubRepo;
  commit: CommitResult;
}> {
  const github = getGitHubClient();

  // Sanitize repo name
  const repoName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  // Create repository
  const repo = await github.createRepository({
    name: repoName,
    description: projectDescription,
    isPrivate: true,
    autoInit: true,
  });

  // Wait a moment for GitHub to initialize the repo
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Add all project files in a single commit
  const commit = await github.createMultipleFiles(
    repoName,
    files,
    '🚀 Initial project setup\n\n🤖 Generated by Devvy'
  );

  return { repo, commit };
}
