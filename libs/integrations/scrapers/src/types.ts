/** Raw data extracted from a single platform listing */
export interface ScrapedBusiness {
  name: string;
  address: string;
  city: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  cuisine: string;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  imageUrl: string | null;
  sourceUrl: string;
  source: 'ubereats' | 'deliveroo' | 'google' | 'website';
}

/** Result of analyzing an existing website */
export interface WebsiteAnalysis {
  url: string;
  title: string | null;
  description: string | null;
  contactInfo: {
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  socialLinks: Record<string, string | null>;
  techStack: string[];
  hasModernDesign: boolean;
  isResponsive: boolean;
  /** ISO date string from WHOIS or archive.org, null if unknown */
  domainCreatedAt: string | null;
  /** ISO date string of last detected update */
  lastUpdated: string | null;
  /** Performance / quality score 0-100 */
  qualityScore: number;
}

/** Fully reconciled, deduplicated prospect ready for DB insertion */
export interface ReconciledProspect {
  businessName: string;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
  address: string;
  city: string;
  postalCode: string | null;
  website: string | null;
  uberEatsUrl: string | null;
  deliverooUrl: string | null;
  logoUrl: string | null;
  description: string | null;
  cuisineType: string;
  openingHours: Record<string, string> | null;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  source: string;
  sourceUrl: string;
  /** 0-1 confidence that this is a real, unique business */
  confidence: number;
  /** Website analysis if available */
  websiteAnalysis: WebsiteAnalysis | null;
}

/** Options for the scraping pipeline */
export interface ScrapingOptions {
  /** Max results per source (default: 50) */
  maxResults?: number;
  /** Delay between requests in ms (default: 2000) */
  delayMs?: number;
  /** Whether to also analyze found websites (default: true) */
  analyzeWebsites?: boolean;
  /** Proxy URL (e.g., http://user:pass@proxy:8080) */
  proxyUrl?: string;
  /** Request timeout in ms (default: 30000) */
  timeoutMs?: number;
}
