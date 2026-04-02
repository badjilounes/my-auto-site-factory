/** Data about a prospect passed to the site generator */
export interface ProspectData {
  businessName: string;
  ownerName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city: string;
  postalCode?: string | null;
  website?: string | null;
  description?: string | null;
  cuisineType?: string | null;
  openingHours?: Record<string, string> | null;
  rating?: number | null;
  reviewCount?: number | null;
  priceRange?: string | null;
  logoUrl?: string | null;
}

export type SiteTemplate = 'restaurant' | 'cafe' | 'bakery' | 'generic';

export interface GenerationOptions {
  /** Template to use (default: auto-detected from cuisineType) */
  template?: SiteTemplate;
  /** Color scheme override (hex primary color) */
  primaryColor?: string;
  /** Additional instructions to append to the prompt */
  extraInstructions?: string;
  /** Max tokens for the generation (default: 16384) */
  maxTokens?: number;
  /** Model to use (default: claude-sonnet-4-20250514) */
  model?: string;
  /** Stream the response for progress tracking */
  onProgress?: (event: ProgressEvent) => void;
}

export interface ProgressEvent {
  type: 'start' | 'generating' | 'parsing' | 'done';
  tokensUsed?: number;
  filesGenerated?: number;
  message: string;
}

export interface GenerationResult {
  /** Map of file path → file content */
  files: Record<string, string>;
  /** Standalone HTML preview of the homepage (for iframe preview in dashboard) */
  previewHtml: string;
  /** Tokens used for the generation */
  tokensUsed: number;
  /** Template that was used */
  template: SiteTemplate;
}
