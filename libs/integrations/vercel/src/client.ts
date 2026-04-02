import type {
  VercelProject,
  VercelDeployment,
  VercelDeploymentState,
  VercelDomain,
  VercelDomainConfig,
  CreateProjectOptions,
  DeployResult,
  DomainResult,
} from './types';

const API_BASE = 'https://api.vercel.com';

// ── Internal HTTP client ─────────────────────────────────────────────────────

function getToken(): string {
  const token = process.env['VERCEL_TOKEN'];
  if (!token) throw new Error('VERCEL_TOKEN environment variable is required');
  return token;
}

function getTeamId(): string | undefined {
  return process.env['VERCEL_TEAM_ID'] || undefined;
}

async function vercelFetch<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
  queryParams?: Record<string, string>,
): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);

  // Always attach teamId if available
  const teamId = queryParams?.teamId ?? getTeamId();
  if (teamId) url.searchParams.set('teamId', teamId);

  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (key !== 'teamId') url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'Unknown error');
    throw new Error(`Vercel API ${method} ${path} failed (${response.status}): ${errorBody}`);
  }

  // Some endpoints return 204 No Content
  if (response.status === 204) return {} as T;

  return response.json() as Promise<T>;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a Vercel project linked to a GitHub repository.
 *
 * The project will auto-deploy from the repo's main branch.
 * Vercel's GitHub integration must be installed on the repo.
 *
 * @param repoFullName - GitHub repo in "owner/name" format (e.g. "myuser/site-pizza-napoli")
 * @param options - Team ID, production branch, env vars, etc.
 * @returns Created project info
 */
export async function createProject(
  repoFullName: string,
  options?: CreateProjectOptions,
): Promise<VercelProject> {
  const [owner, repoName] = repoFullName.split('/');
  if (!owner || !repoName) {
    throw new Error(`Invalid repo format "${repoFullName}". Expected "owner/name".`);
  }

  const projectName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-');

  const body: Record<string, unknown> = {
    name: projectName,
    framework: 'nextjs',
    gitRepository: {
      type: 'github',
      repo: repoFullName,
    },
    buildCommand: options?.buildCommand ?? 'npm run build',
    rootDirectory: options?.rootDirectory ?? null,
    installCommand: 'npm install',
  };

  if (options?.productionBranch) {
    body.commandForIgnoringBuildStep = '';
  }

  const project = await vercelFetch<VercelProject>(
    'POST',
    '/v10/projects',
    body,
    options?.teamId ? { teamId: options.teamId } : undefined,
  );

  // Set environment variables if provided
  if (options?.envVars && Object.keys(options.envVars).length > 0) {
    await setProjectEnvVars(project.id, options.envVars, options?.teamId);
  }

  return project;
}

/**
 * Trigger a production deployment for a project.
 *
 * In practice, Vercel auto-deploys when code is pushed to the linked repo.
 * This function is useful for manually re-deploying or triggering the
 * initial deployment after project creation.
 *
 * @param projectId - Vercel project ID or name
 * @returns Deployment info including URL
 */
export async function deploy(projectId: string): Promise<DeployResult> {
  const deployment = await vercelFetch<VercelDeployment>(
    'POST',
    '/v13/deployments',
    {
      name: projectId,
      target: 'production',
      gitSource: {
        type: 'github',
        ref: 'main',
      },
    },
  );

  return {
    deploymentId: deployment.uid || deployment.id,
    url: ensureHttps(deployment.url),
    inspectorUrl: deployment.inspectorUrl ?? null,
    state: deployment.readyState ?? deployment.state ?? 'QUEUED',
    productionUrl: null, // Resolved after deployment is READY
  };
}

/**
 * Get the current status and URL of a deployment.
 *
 * @param deploymentId - Deployment ID (uid)
 * @returns Deployment state and URLs
 */
export async function getDeploymentStatus(deploymentId: string): Promise<DeployResult> {
  const deployment = await vercelFetch<VercelDeployment>(
    'GET',
    `/v13/deployments/${deploymentId}`,
  );

  return {
    deploymentId: deployment.uid || deployment.id,
    url: ensureHttps(deployment.url),
    inspectorUrl: deployment.inspectorUrl ?? null,
    state: deployment.readyState ?? deployment.state,
    productionUrl: deployment.readyState === 'READY' ? ensureHttps(deployment.url) : null,
  };
}

/**
 * Get the live production deployment URL for a project.
 *
 * @param projectId - Vercel project ID or name
 * @returns Production URL (e.g. "https://site-pizza-napoli.vercel.app") or null if not deployed
 */
export async function getDeploymentUrl(projectId: string): Promise<string | null> {
  try {
    // List deployments, filter for production + READY
    const data = await vercelFetch<{ deployments: VercelDeployment[] }>(
      'GET',
      '/v6/deployments',
      undefined,
      { projectId, target: 'production', state: 'READY', limit: '1' },
    );

    const latest = data.deployments?.[0];
    if (!latest) return null;

    return ensureHttps(latest.url);
  } catch {
    return null;
  }
}

/**
 * Wait for a deployment to reach READY state (or fail).
 *
 * Polls every `intervalMs` until the deployment is READY, ERROR, or CANCELED,
 * or until `timeoutMs` is reached.
 *
 * @param deploymentId - Deployment ID
 * @param timeoutMs - Max wait time (default: 5 minutes)
 * @param intervalMs - Poll interval (default: 5 seconds)
 * @returns Final deployment status
 */
export async function waitForDeployment(
  deploymentId: string,
  timeoutMs = 300_000,
  intervalMs = 5_000,
): Promise<DeployResult> {
  const deadline = Date.now() + timeoutMs;
  const terminalStates: VercelDeploymentState[] = ['READY', 'ERROR', 'CANCELED'];

  while (Date.now() < deadline) {
    const status = await getDeploymentStatus(deploymentId);

    if (terminalStates.includes(status.state)) {
      return status;
    }

    await sleep(intervalMs);
  }

  throw new Error(`Deployment ${deploymentId} timed out after ${timeoutMs / 1000}s`);
}

/**
 * Add a custom domain to a Vercel project.
 *
 * Returns the DNS records the client needs to configure.
 *
 * @param projectId - Vercel project ID or name
 * @param domain - Custom domain (e.g. "pizzanapoli.fr" or "www.pizzanapoli.fr")
 * @returns Domain info + DNS instructions
 */
export async function addDomain(
  projectId: string,
  domain: string,
): Promise<DomainResult> {
  // Add domain to project
  const vercelDomain = await vercelFetch<VercelDomain>(
    'POST',
    `/v10/projects/${projectId}/domains`,
    { name: domain },
  );

  // Get domain config for DNS instructions
  const dnsRecords = await getDnsInstructions(domain, vercelDomain);

  return {
    domain: vercelDomain.name,
    verified: vercelDomain.verified,
    dnsRecords,
  };
}

/**
 * Remove a custom domain from a Vercel project.
 */
export async function removeDomain(projectId: string, domain: string): Promise<void> {
  await vercelFetch<void>('DELETE', `/v10/projects/${projectId}/domains/${domain}`);
}

/**
 * Verify a custom domain's DNS configuration.
 *
 * @param projectId - Vercel project ID
 * @param domain - Domain to verify
 * @returns Whether the domain is verified
 */
export async function verifyDomain(projectId: string, domain: string): Promise<boolean> {
  try {
    const result = await vercelFetch<{ verified: boolean }>(
      'POST',
      `/v10/projects/${projectId}/domains/${domain}/verify`,
    );
    return result.verified;
  } catch {
    return false;
  }
}

/**
 * Get project info (including latest deployment).
 */
export async function getProject(projectId: string): Promise<VercelProject> {
  return vercelFetch<VercelProject>('GET', `/v9/projects/${projectId}`);
}

/**
 * List all domains for a project.
 */
export async function listDomains(projectId: string): Promise<VercelDomain[]> {
  const data = await vercelFetch<{ domains: VercelDomain[] }>(
    'GET',
    `/v9/projects/${projectId}/domains`,
  );
  return data.domains ?? [];
}

/**
 * Delete a Vercel project.
 */
export async function deleteProject(projectId: string): Promise<void> {
  await vercelFetch<void>('DELETE', `/v9/projects/${projectId}`);
}

// ── Env vars ─────────────────────────────────────────────────────────────────

async function setProjectEnvVars(
  projectId: string,
  envVars: Record<string, string>,
  teamId?: string,
): Promise<void> {
  const body = Object.entries(envVars).map(([key, value]) => ({
    key,
    value,
    target: ['production', 'preview'],
    type: 'encrypted',
  }));

  await vercelFetch(
    'POST',
    `/v10/projects/${projectId}/env`,
    body as unknown as Record<string, unknown>,
    teamId ? { teamId } : undefined,
  );
}

// ── DNS instructions ─────────────────────────────────────────────────────────

async function getDnsInstructions(
  domain: string,
  vercelDomain: VercelDomain,
): Promise<{ type: string; name: string; value: string }[]> {
  // Check if it's an apex domain (e.g., "pizzanapoli.fr") or subdomain ("www.pizzanapoli.fr")
  const isApex = domain === vercelDomain.apexName;

  // Try to get domain config for specific instructions
  try {
    const config = await vercelFetch<VercelDomainConfig>(
      'GET',
      `/v6/domains/${domain}/config`,
    );

    // If verification records exist, return those
    if (vercelDomain.verification && vercelDomain.verification.length > 0) {
      return vercelDomain.verification.map((v) => ({
        type: v.type,
        name: v.domain,
        value: v.value,
      }));
    }

    // Default records based on domain type
    if (isApex) {
      return [
        { type: 'A', name: '@', value: '76.76.21.21' },
      ];
    }

    return [
      { type: 'CNAME', name: domain.split('.')[0], value: 'cname.vercel-dns.com' },
    ];
  } catch {
    // Fallback DNS instructions
    if (isApex) {
      return [
        { type: 'A', name: '@', value: '76.76.21.21' },
      ];
    }

    return [
      { type: 'CNAME', name: domain.split('.')[0], value: 'cname.vercel-dns.com' },
    ];
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureHttps(url: string): string {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  return `https://${url}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
