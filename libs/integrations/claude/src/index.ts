// Main generation function
export { generateVitrineSite } from './generate';

// Templates and prompts
export { buildSystemPrompt, buildUserPrompt, detectTemplate } from './templates';

// Preview builder
export { buildPreviewHtml } from './preview';

// Types
export type {
  ProspectData,
  SiteTemplate,
  GenerationOptions,
  GenerationResult,
  ProgressEvent,
} from './types';
