import * as cheerio from 'cheerio';
import type { WebsiteAnalysis } from './types';

/**
 * Deep-analyze an existing website to assess quality and extract data.
 *
 * Checks:
 * - Meta tags (title, description, OG tags)
 * - Contact info (email, phone, address via mailto/tel links + regex + schema.org)
 * - Social links (Facebook, Instagram, Twitter, LinkedIn, Yelp, TripAdvisor)
 * - Tech stack detection (React, Next.js, WordPress, Wix, Squarespace, etc.)
 * - Responsive design (viewport meta, media queries, flexbox/grid)
 * - Domain age via WHOIS-like heuristic (Wayback Machine CDX API)
 * - Last update detection (meta tags, sitemap, Last-Modified header)
 * - Quality score (0-100) combining all signals
 */
export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  // Normalize URL
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  const [pageAnalysis, domainAge] = await Promise.allSettled([
    analyzePageContent(normalizedUrl),
    fetchDomainCreationDate(normalizedUrl),
  ]);

  const page = pageAnalysis.status === 'fulfilled' ? pageAnalysis.value : null;
  const createdAt = domainAge.status === 'fulfilled' ? domainAge.value : null;

  if (!page) {
    throw new Error(`Failed to analyze website "${url}": could not fetch page`);
  }

  const qualityScore = computeQualityScore(page, createdAt);

  return {
    url: normalizedUrl,
    title: page.title,
    description: page.description,
    contactInfo: page.contactInfo,
    socialLinks: page.socialLinks,
    techStack: page.techStack,
    hasModernDesign: page.hasModernDesign,
    isResponsive: page.isResponsive,
    domainCreatedAt: createdAt,
    lastUpdated: page.lastUpdated,
    qualityScore,
  };
}

// ── Page content analysis ─────────────────────────────────────────────────────

interface PageAnalysisResult {
  title: string | null;
  description: string | null;
  contactInfo: { email: string | null; phone: string | null; address: string | null };
  socialLinks: Record<string, string | null>;
  techStack: string[];
  hasModernDesign: boolean;
  isResponsive: boolean;
  lastUpdated: string | null;
}

async function analyzePageContent(url: string): Promise<PageAnalysisResult> {
  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  // Last-Modified header
  const lastModifiedHeader = response.headers.get('last-modified');

  const html = await response.text();
  const $ = cheerio.load(html);
  const htmlLower = html.toLowerCase();

  // ── Title & description
  const title =
    $('meta[property="og:title"]').attr('content')?.trim() ||
    $('title').first().text().trim() ||
    null;

  const description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    null;

  // ── Contact info
  const bodyText = $('body').text();

  // Email: prefer mailto links, fallback to regex
  const emailFromHref = $('a[href^="mailto:"]')
    .first()
    .attr('href')
    ?.replace('mailto:', '')
    ?.split('?')[0];
  const emailMatch = bodyText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const email = emailFromHref || emailMatch?.[0] || null;

  // Phone: prefer tel links, fallback to French phone regex
  const phoneFromHref = $('a[href^="tel:"]').first().attr('href')?.replace('tel:', '');
  const phoneMatch = bodyText.match(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/);
  const phone = phoneFromHref || phoneMatch?.[0]?.trim() || null;

  // Address: schema.org structured data first, then CSS selectors, then regex
  let address: string | null = null;
  const schemaAddress = $('[itemprop="address"], [itemtype*="PostalAddress"]')
    .first()
    .text()
    .trim();
  if (schemaAddress) {
    address = schemaAddress.replace(/\s+/g, ' ');
  } else {
    const addressEl = $(
      '.address, #address, [class*="address" i], [class*="adresse" i], [data-testid*="address"]',
    )
      .first()
      .text()
      .trim();
    if (addressEl) {
      address = addressEl.replace(/\s+/g, ' ');
    } else {
      // Regex for French addresses
      const addrMatch = bodyText.match(
        /(\d{1,4}[\s,]+(?:rue|avenue|boulevard|place|impasse|chemin|allée|passage|quai|cours)\s[^,\n]{3,60},?\s*\d{5}\s+\w+)/i,
      );
      address = addrMatch?.[1]?.trim() || null;
    }
  }

  // ── Social links
  const allLinks = $('a[href]')
    .map((_, el) => $(el).attr('href'))
    .get()
    .filter((href): href is string => typeof href === 'string');

  const findSocial = (patterns: string[]): string | null => {
    for (const link of allLinks) {
      for (const p of patterns) {
        if (link.includes(p)) return link;
      }
    }
    return null;
  };

  const socialLinks: Record<string, string | null> = {
    facebook: findSocial(['facebook.com', 'fb.com']),
    instagram: findSocial(['instagram.com']),
    twitter: findSocial(['twitter.com', 'x.com']),
    linkedin: findSocial(['linkedin.com']),
    yelp: findSocial(['yelp.com', 'yelp.fr']),
    tripadvisor: findSocial(['tripadvisor.com', 'tripadvisor.fr']),
    google_maps: findSocial(['google.com/maps', 'maps.google', 'goo.gl/maps']),
  };

  // ── Tech stack detection
  const techStack: string[] = [];

  // Frameworks
  if (htmlLower.includes('__next') || htmlLower.includes('_next/static'))
    techStack.push('Next.js');
  if (htmlLower.includes('__nuxt') || htmlLower.includes('_nuxt'))
    techStack.push('Nuxt.js');
  if (htmlLower.includes('gatsby')) techStack.push('Gatsby');
  if (htmlLower.includes('react') || htmlLower.includes('__react'))
    techStack.push('React');
  if (htmlLower.includes('vue') && !techStack.includes('Nuxt.js'))
    techStack.push('Vue.js');
  if (htmlLower.includes('angular')) techStack.push('Angular');

  // CMS / Website builders
  if (htmlLower.includes('wp-content') || htmlLower.includes('wordpress'))
    techStack.push('WordPress');
  if (htmlLower.includes('wix.com') || htmlLower.includes('wixsite'))
    techStack.push('Wix');
  if (htmlLower.includes('squarespace')) techStack.push('Squarespace');
  if (htmlLower.includes('shopify')) techStack.push('Shopify');
  if (htmlLower.includes('webflow')) techStack.push('Webflow');
  if (htmlLower.includes('jimdo')) techStack.push('Jimdo');
  if (htmlLower.includes('weebly')) techStack.push('Weebly');
  if (htmlLower.includes('prestashop')) techStack.push('PrestaShop');
  if (htmlLower.includes('joomla')) techStack.push('Joomla');
  if (htmlLower.includes('drupal')) techStack.push('Drupal');

  // CSS frameworks
  if (htmlLower.includes('tailwind') || htmlLower.includes('tw-'))
    techStack.push('Tailwind CSS');
  if (htmlLower.includes('bootstrap')) techStack.push('Bootstrap');

  // ── Responsive & modern design
  const hasViewport = $('meta[name="viewport"]').length > 0;
  const hasFlexbox = htmlLower.includes('display:flex') || htmlLower.includes('display: flex');
  const hasGrid = htmlLower.includes('display:grid') || htmlLower.includes('display: grid');
  const hasMediaQueries = htmlLower.includes('@media');

  const isResponsive = hasViewport && (hasMediaQueries || hasFlexbox || hasGrid);

  const modernSignals = [
    hasViewport,
    hasFlexbox,
    hasGrid,
    hasMediaQueries,
    techStack.some((t) =>
      ['Next.js', 'Nuxt.js', 'React', 'Vue.js', 'Tailwind CSS', 'Webflow'].includes(t),
    ),
    $('link[rel="preload"], link[rel="preconnect"]').length > 0,
    html.includes('loading="lazy"') || html.includes('loading=\\"lazy\\"'),
  ];
  const hasModernDesign = modernSignals.filter(Boolean).length >= 3;

  // ── Last updated
  const lastUpdated =
    $('meta[name="last-modified"]').attr('content') ||
    $('meta[property="article:modified_time"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    $('meta[http-equiv="last-modified"]').attr('content') ||
    lastModifiedHeader ||
    null;

  return {
    title,
    description,
    contactInfo: { email, phone, address },
    socialLinks,
    techStack,
    hasModernDesign,
    isResponsive,
    lastUpdated,
  };
}

// ── Domain age via Wayback Machine CDX API ────────────────────────────────────

/**
 * Fetch the earliest snapshot date from the Wayback Machine CDX API.
 * This gives us a reasonable approximation of when the domain/site was created.
 * Falls back to null if the API is unreachable or has no data.
 */
async function fetchDomainCreationDate(url: string): Promise<string | null> {
  try {
    const hostname = new URL(url).hostname;
    // CDX API: get the very first snapshot
    const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${hostname}&output=json&limit=1&fl=timestamp&from=19960101`;

    const response = await fetch(cdxUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'MonSiteVitrine-Analyzer/1.0' },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as string[][];
    // First row is header ["timestamp"], second row is data
    if (data.length < 2 || !data[1]?.[0]) return null;

    const ts = data[1][0]; // Format: YYYYMMDDHHmmss
    const year = ts.slice(0, 4);
    const month = ts.slice(4, 6);
    const day = ts.slice(6, 8);
    return `${year}-${month}-${day}`;
  } catch {
    return null;
  }
}

// ── Quality score computation ────────────────────────────────────────────────

function computeQualityScore(
  page: PageAnalysisResult,
  domainCreatedAt: string | null,
): number {
  let score = 0;
  const max = 100;

  // Has basic SEO (title + description) — 15 pts
  if (page.title) score += 8;
  if (page.description) score += 7;

  // Is responsive — 15 pts
  if (page.isResponsive) score += 15;

  // Modern design — 15 pts
  if (page.hasModernDesign) score += 15;

  // Uses a modern framework — 10 pts
  const modernFrameworks = ['Next.js', 'Nuxt.js', 'React', 'Vue.js', 'Gatsby', 'Webflow'];
  if (page.techStack.some((t) => modernFrameworks.includes(t))) score += 10;

  // Has contact info — 10 pts
  if (page.contactInfo.email) score += 4;
  if (page.contactInfo.phone) score += 3;
  if (page.contactInfo.address) score += 3;

  // Has social links — 10 pts
  const socialCount = Object.values(page.socialLinks).filter(Boolean).length;
  score += Math.min(socialCount * 2, 10);

  // Recently updated — 10 pts
  if (page.lastUpdated) {
    const lastUpdate = new Date(page.lastUpdated);
    const monthsAgo = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo < 6) score += 10;
    else if (monthsAgo < 12) score += 5;
    else if (monthsAgo < 24) score += 2;
  }

  // Domain age — 15 pts (older = more established but maybe needs refresh)
  if (domainCreatedAt) {
    const created = new Date(domainCreatedAt);
    const yearsOld = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (yearsOld >= 5) score += 15;
    else if (yearsOld >= 2) score += 10;
    else if (yearsOld >= 1) score += 5;
  }

  return Math.min(score, max);
}
