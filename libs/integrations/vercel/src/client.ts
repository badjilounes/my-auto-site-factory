const VERCEL_API_BASE = 'https://api.vercel.com';

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  link?: {
    type: string;
    repo: string;
  };
}

export interface VercelDeployment {
  id: string;
  url: string;
  state: string;
  readyState: string;
  createdAt: number;
}

export interface VercelDomain {
  name: string;
  verified: boolean;
}

export class VercelIntegration {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const url = new URL(`${VERCEL_API_BASE}${path}`);
    if (queryParams) {
      for (const [key, value] of Object.entries(queryParams)) {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Vercel API error (${response.status}): ${errorBody}`
      );
    }

    return response.json() as Promise<T>;
  }

  async createProject(
    name: string,
    repoUrl: string,
    teamId?: string
  ): Promise<VercelProject> {
    try {
      // Parse the GitHub repo URL to extract owner/repo
      const repoMatch = repoUrl.match(
        /github\.com[/:]([^/]+)\/([^/.]+)/
      );
      if (!repoMatch) {
        throw new Error(`Invalid GitHub repo URL: ${repoUrl}`);
      }

      const [, repoOwner, repoName] = repoMatch;

      const queryParams: Record<string, string> = {};
      if (teamId) {
        queryParams.teamId = teamId;
      }

      const project = await this.request<VercelProject>(
        'POST',
        '/v10/projects',
        {
          name,
          framework: 'nextjs',
          gitRepository: {
            type: 'github',
            repo: `${repoOwner}/${repoName}`,
          },
        },
        queryParams
      );

      return project;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to create Vercel project "${name}": ${message}`
      );
    }
  }

  async triggerDeployment(
    projectId: string
  ): Promise<VercelDeployment> {
    try {
      const deployment = await this.request<VercelDeployment>(
        'POST',
        '/v13/deployments',
        {
          name: projectId,
          target: 'production',
        }
      );

      return deployment;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to trigger deployment for project "${projectId}": ${message}`
      );
    }
  }

  async getDeploymentStatus(
    deploymentId: string
  ): Promise<VercelDeployment> {
    try {
      const deployment = await this.request<VercelDeployment>(
        'GET',
        `/v13/deployments/${deploymentId}`
      );

      return deployment;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to get deployment status for "${deploymentId}": ${message}`
      );
    }
  }

  async setCustomDomain(
    projectId: string,
    domain: string
  ): Promise<VercelDomain> {
    try {
      const domainResult = await this.request<VercelDomain>(
        'POST',
        `/v10/projects/${projectId}/domains`,
        { name: domain }
      );

      return domainResult;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to set custom domain "${domain}" for project "${projectId}": ${message}`
      );
    }
  }
}

export function createVercelClient(token: string): VercelIntegration {
  return new VercelIntegration(token);
}
