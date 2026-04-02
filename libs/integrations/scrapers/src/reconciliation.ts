import type { ScrapedBusiness } from './ubereats';
import type { WebsiteAnalysis } from './website-analyzer';

export interface EnrichedProspect {
  name: string;
  address: string;
  cuisine: string;
  rating: number | null;
  priceRange: string | null;
  imageUrl: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  hasModernWebsite: boolean | null;
  socialLinks: {
    facebook: string | null;
    instagram: string | null;
    twitter: string | null;
    linkedin: string | null;
    yelp: string | null;
  };
  sources: string[];
  confidence: number;
}

/**
 * Calculate a fuzzy similarity score between two strings.
 * Returns a value between 0 (no match) and 1 (exact match).
 */
function fuzzyMatch(a: string, b: string): number {
  const normalizedA = a.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normalizedB = b.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normalizedA === normalizedB) return 1;
  if (!normalizedA || !normalizedB) return 0;

  // Check if one string contains the other
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) {
    const shorter = Math.min(normalizedA.length, normalizedB.length);
    const longer = Math.max(normalizedA.length, normalizedB.length);
    return shorter / longer;
  }

  // Levenshtein distance-based similarity
  const distance = levenshteinDistance(normalizedA, normalizedB);
  const maxLen = Math.max(normalizedA.length, normalizedB.length);
  return 1 - distance / maxLen;
}

/**
 * Compute the Levenshtein edit distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Use a single-row DP approach for space efficiency
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    for (let j = 0; j <= n; j++) {
      prev[j] = curr[j];
    }
  }

  return prev[n];
}

/**
 * Select the most complete non-empty value from candidates.
 */
function pickBest<T extends string | number | null>(
  ...candidates: (T | undefined)[]
): T | null {
  for (const c of candidates) {
    if (c !== null && c !== undefined && c !== '') return c;
  }
  return null;
}

/**
 * Reconcile business data from multiple scraping sources into a single
 * enriched prospect record. Uses fuzzy name matching to pair entries
 * from Uber Eats and Deliveroo, then augments with website analysis data.
 */
export function reconcileBusinessData(
  uberEatsData: ScrapedBusiness[],
  deliverooData: ScrapedBusiness[],
  websiteData?: WebsiteAnalysis
): EnrichedProspect[] {
  const MATCH_THRESHOLD = 0.6;
  const results: EnrichedProspect[] = [];
  const matchedDeliverooIndices = new Set<number>();

  // For each Uber Eats entry, try to find a matching Deliveroo entry
  for (const ueEntry of uberEatsData) {
    let bestMatch: ScrapedBusiness | null = null;
    let bestScore = 0;
    let bestIndex = -1;

    for (let i = 0; i < deliverooData.length; i++) {
      if (matchedDeliverooIndices.has(i)) continue;

      const score = fuzzyMatch(ueEntry.name, deliverooData[i].name);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = deliverooData[i];
        bestIndex = i;
      }
    }

    const isMatched = bestScore >= MATCH_THRESHOLD && bestMatch !== null;
    if (isMatched) {
      matchedDeliverooIndices.add(bestIndex);
    }

    const sources: string[] = ['ubereats'];
    if (isMatched) sources.push('deliveroo');

    // Merge data, preferring the most complete values
    const merged: EnrichedProspect = {
      name: ueEntry.name.length >= (bestMatch?.name.length ?? 0)
        ? ueEntry.name
        : bestMatch?.name ?? ueEntry.name,
      address: pickBest(ueEntry.address, isMatched ? bestMatch!.address : null) ?? '',
      cuisine: pickBest(ueEntry.cuisine, isMatched ? bestMatch!.cuisine : null) ?? '',
      rating: mergeRatings(
        ueEntry.rating,
        isMatched ? bestMatch!.rating : null
      ),
      priceRange: pickBest(
        ueEntry.priceRange,
        isMatched ? bestMatch!.priceRange : null
      ),
      imageUrl: pickBest(
        ueEntry.imageUrl,
        isMatched ? bestMatch!.imageUrl : null
      ),
      email: null,
      phone: null,
      website: null,
      hasModernWebsite: null,
      socialLinks: {
        facebook: null,
        instagram: null,
        twitter: null,
        linkedin: null,
        yelp: null,
      },
      sources,
      confidence: isMatched ? 0.8 : 0.5,
    };

    results.push(merged);
  }

  // Add unmatched Deliveroo entries
  for (let i = 0; i < deliverooData.length; i++) {
    if (matchedDeliverooIndices.has(i)) continue;

    const dEntry = deliverooData[i];
    results.push({
      name: dEntry.name,
      address: dEntry.address,
      cuisine: dEntry.cuisine,
      rating: dEntry.rating,
      priceRange: dEntry.priceRange,
      imageUrl: dEntry.imageUrl,
      email: null,
      phone: null,
      website: null,
      hasModernWebsite: null,
      socialLinks: {
        facebook: null,
        instagram: null,
        twitter: null,
        linkedin: null,
        yelp: null,
      },
      sources: ['deliveroo'],
      confidence: 0.5,
    });
  }

  // Augment with website data if provided
  if (websiteData) {
    // Try to match website data against prospects by name
    for (const prospect of results) {
      const websiteTitle = websiteData.title ?? '';
      const nameScore = fuzzyMatch(prospect.name, websiteTitle);

      if (nameScore >= MATCH_THRESHOLD) {
        prospect.email = pickBest(
          websiteData.contactInfo.email,
          prospect.email
        );
        prospect.phone = pickBest(
          websiteData.contactInfo.phone,
          prospect.phone
        );
        prospect.address = pickBest(
          websiteData.contactInfo.address,
          prospect.address
        ) ?? prospect.address;
        prospect.website = websiteData.url;
        prospect.hasModernWebsite = websiteData.hasModernDesign;
        prospect.socialLinks = {
          facebook: pickBest(
            websiteData.socialLinks.facebook,
            prospect.socialLinks.facebook
          ),
          instagram: pickBest(
            websiteData.socialLinks.instagram,
            prospect.socialLinks.instagram
          ),
          twitter: pickBest(
            websiteData.socialLinks.twitter,
            prospect.socialLinks.twitter
          ),
          linkedin: pickBest(
            websiteData.socialLinks.linkedin,
            prospect.socialLinks.linkedin
          ),
          yelp: pickBest(
            websiteData.socialLinks.yelp,
            prospect.socialLinks.yelp
          ),
        };
        prospect.sources.push('website');
        prospect.confidence = Math.min(prospect.confidence + 0.15, 1.0);
        break; // Only apply to the best match
      }
    }
  }

  return results;
}

/**
 * Average two ratings, ignoring null values.
 */
function mergeRatings(
  a: number | null,
  b: number | null
): number | null {
  if (a !== null && b !== null) {
    return Math.round(((a + b) / 2) * 10) / 10;
  }
  return a ?? b;
}
