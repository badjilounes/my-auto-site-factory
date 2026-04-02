// Main API
export {
  createProject,
  deploy,
  getDeploymentStatus,
  getDeploymentUrl,
  waitForDeployment,
  addDomain,
  removeDomain,
  verifyDomain,
  getProject,
  listDomains,
  deleteProject,
} from './client';

// Types
export type {
  VercelProject,
  VercelDeployment,
  VercelDeploymentState,
  VercelDomain,
  VercelDomainConfig,
  VercelDomainVerification,
  CreateProjectOptions,
  DeployResult,
  DomainResult,
} from './types';
