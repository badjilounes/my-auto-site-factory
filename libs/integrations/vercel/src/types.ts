// ── API response types (subset of Vercel REST API) ───────────────────────────

export interface VercelProject {
  id: string;
  name: string;
  accountId: string;
  framework: string | null;
  link?: {
    type: string;
    repo: string;
    repoId: number;
    org: string;
    gitCredentialId: string;
    productionBranch: string;
  };
  latestDeployments?: VercelDeployment[];
}

export interface VercelDeployment {
  id: string;
  uid: string;
  url: string;
  name: string;
  state: VercelDeploymentState;
  readyState: VercelDeploymentState;
  target: 'production' | 'preview' | null;
  createdAt: number;
  buildingAt?: number;
  ready?: number;
  inspectorUrl?: string;
  meta?: Record<string, string>;
}

export type VercelDeploymentState =
  | 'QUEUED'
  | 'BUILDING'
  | 'INITIALIZING'
  | 'READY'
  | 'ERROR'
  | 'CANCELED';

export interface VercelDomain {
  name: string;
  apexName: string;
  projectId: string;
  verified: boolean;
  verification?: VercelDomainVerification[];
  gitBranch: string | null;
  redirect: string | null;
  redirectStatusCode: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface VercelDomainVerification {
  type: string;
  domain: string;
  value: string;
  reason: string;
}

export interface VercelDomainConfig {
  configuredBy: 'CNAME' | 'A' | 'http' | null;
  acceptedChallenges: string[];
  misconfigured: boolean;
}

// ── Our types ────────────────────────────────────────────────────────────────

export interface CreateProjectOptions {
  /** Vercel team ID (for team accounts, from VERCEL_TEAM_ID env) */
  teamId?: string;
  /** Git production branch (default: "main") */
  productionBranch?: string;
  /** Root directory in the repo (default: ".") */
  rootDirectory?: string;
  /** Build command override */
  buildCommand?: string;
  /** Environment variables to set on the project */
  envVars?: Record<string, string>;
}

export interface DeployResult {
  deploymentId: string;
  url: string;
  inspectorUrl: string | null;
  state: VercelDeploymentState;
  productionUrl: string | null;
}

export interface DomainResult {
  domain: string;
  verified: boolean;
  /** DNS records to configure (shown to client in portal) */
  dnsRecords: { type: string; name: string; value: string }[];
}
