import type { ScrapedBusiness, ReconciledProspect, WebsiteAnalysis } from './types';

/**
 * Reconcile business data from multiple scraping sources into deduplicated
 * prospect records ready for database insertion.
 *
 * Strategy:
 * 1. Normalize all business names and addresses
 * 2. Cross-match UberEats ↔ Deliveroo entries using fuzzy name matching + address matching
 * 3. Merge matched entries (prefer the most complete data)
 * 4. Add unmatched entries from each source
 * 5. Optionally enrich with website analysis data
 * 6. Final deduplication pass
 * 7. Assign confidence scores
 */
export function reconcileBusinessData(
  uberEatsData: ScrapedBusiness[],
  deliverooData: ScrapedBusiness[],
  websiteAnalyses?: Map<string, WebsiteAnalysis>,
): ReconciledProspect[] {
  const NAME_THRESHOLD = 0.6;
  const ADDRESS_BONUS = 0.2; // Bonus when addresses also match

  const results: ReconciledProspect[] = [];
  const matchedDeliverooIndices = new Set<number>();

  // ── Phase 1: Match UberEats entries against Deliveroo
  for (const ue of uberEatsData) {
    let bestMatch: ScrapedBusiness | null = null;
    let bestScore = 0;
    let bestIndex = -1;

    for (let i = 0; i < deliverooData.length; i++) {
      if (matchedDeliverooIndices.has(i)) continue;

      const del = deliverooData[i];

      // Name similarity
      let score = fuzzyMatch(ue.name, del.name);

      // Address bonus: if both have addresses and they match, boost score
      if (ue.address && del.address) {
        const addrScore = fuzzyMatch(
          normalizeAddress(ue.address),
          normalizeAddress(del.address),
        );
        if (addrScore > 0.5) {
          score += ADDRESS_BONUS;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = del;
        bestIndex = i;
      }
    }

    const matched = bestScore >= NAME_THRESHOLD && bestMatch !== null;
    if (matched) {
      matchedDeliverooIndices.add(bestIndex);
    }

    results.push(
      mergeIntoProspect(ue, matched ? bestMatch! : null, matched ? bestScore : 0),
    );
  }

  // ── Phase 2: Add unmatched Deliveroo entries
  for (let i = 0; i < deliverooData.length; i++) {
    if (matchedDeliverooIndices.has(i)) continue;
    results.push(mergeIntoProspect(deliverooData[i], null, 0));
  }

  // ── Phase 3: Enrich with website analysis data
  if (websiteAnalyses) {
    for (const prospect of results) {
      // Try to match by business name against website titles
      for (const [url, analysis] of websiteAnalyses) {
        const titleScore = analysis.title
          ? fuzzyMatch(prospect.businessName, analysis.title)
          : 0;

        if (titleScore >= NAME_THRESHOLD) {
          enrichWithWebsite(prospect, analysis);
          prospect.website = url;
          break;
        }
      }
    }
  }

  // ── Phase 4: Final deduplication (catch near-duplicates across sources)
  return finalDeduplication(results);
}

// ── Merge logic ──────────────────────────────────────────────────────────────

function mergeIntoProspect(
  primary: ScrapedBusiness,
  secondary: ScrapedBusiness | null,
  matchScore: number,
): ReconciledProspect {
  const sources: string[] = [primary.source];
  if (secondary) sources.push(secondary.source);

  return {
    businessName: pickLonger(primary.name, secondary?.name),
    ownerName: null,
    email: pick(primary.email, secondary?.email),
    phone: pick(primary.phone, secondary?.phone),
    address: pickLonger(primary.address, secondary?.address),
    city: primary.city || secondary?.city || '',
    postalCode: extractPostalCode(primary.address) || extractPostalCode(secondary?.address),
    website: pick(primary.website, secondary?.website),
    uberEatsUrl: primary.source === 'ubereats' ? primary.sourceUrl : secondary?.source === 'ubereats' ? secondary.sourceUrl : null,
    deliverooUrl: primary.source === 'deliveroo' ? primary.sourceUrl : secondary?.source === 'deliveroo' ? secondary.sourceUrl : null,
    logoUrl: pick(primary.imageUrl, secondary?.imageUrl),
    description: null,
    cuisineType: pickLonger(primary.cuisine, secondary?.cuisine),
    openingHours: null,
    rating: mergeRatings(primary.rating, secondary?.rating ?? null),
    reviewCount: mergeReviewCounts(primary.reviewCount, secondary?.reviewCount ?? null),
    priceRange: pick(primary.priceRange, secondary?.priceRange),
    source: sources.join(','),
    sourceUrl: primary.sourceUrl,
    confidence: computeConfidence(primary, secondary, matchScore),
    websiteAnalysis: null,
  };
}

function enrichWithWebsite(prospect: ReconciledProspect, analysis: WebsiteAnalysis): void {
  prospect.email = prospect.email || analysis.contactInfo.email;
  prospect.phone = prospect.phone || analysis.contactInfo.phone;
  if (analysis.contactInfo.address && !prospect.address) {
    prospect.address = analysis.contactInfo.address;
  }
  prospect.websiteAnalysis = analysis;
  prospect.source += ',website';
  prospect.confidence = Math.min(prospect.confidence + 0.15, 1.0);
}

// ── Confidence scoring ────────────────────────────────────────────────────────

function computeConfidence(
  primary: ScrapedBusiness,
  secondary: ScrapedBusiness | null,
  matchScore: number,
): number {
  let conf = 0.3; // Base: a single source exists

  // Multi-source match
  if (secondary) {
    conf += 0.25;
    // High-quality match
    if (matchScore > 0.8) conf += 0.1;
  }

  // Data completeness bonus
  const fields = [
    primary.name,
    primary.address || secondary?.address,
    primary.phone || secondary?.phone,
    primary.email || secondary?.email,
    primary.rating ?? secondary?.rating,
    primary.cuisine || secondary?.cuisine,
  ];
  const completeness = fields.filter(Boolean).length / fields.length;
  conf += completeness * 0.2;

  // Has phone or email (actionable contact)
  if (primary.phone || secondary?.phone || primary.email || secondary?.email) {
    conf += 0.1;
  }

  return Math.min(Math.round(conf * 100) / 100, 1.0);
}

// ── Final deduplication ──────────────────────────────────────────────────────

function finalDeduplication(prospects: ReconciledProspect[]): ReconciledProspect[] {
  const map = new Map<string, ReconciledProspect>();

  for (const p of prospects) {
    const key = normalizeForDedup(p.businessName);

    const existing = map.get(key);
    if (!existing) {
      map.set(key, p);
      continue;
    }

    // Merge: keep the one with higher confidence, but absorb data from the other
    if (p.confidence > existing.confidence) {
      // Absorb existing data into p
      p.email = p.email || existing.email;
      p.phone = p.phone || existing.phone;
      p.address = p.address || existing.address;
      p.website = p.website || existing.website;
      p.uberEatsUrl = p.uberEatsUrl || existing.uberEatsUrl;
      p.deliverooUrl = p.deliverooUrl || existing.deliverooUrl;
      p.logoUrl = p.logoUrl || existing.logoUrl;
      p.websiteAnalysis = p.websiteAnalysis || existing.websiteAnalysis;
      map.set(key, p);
    } else {
      // Absorb p data into existing
      existing.email = existing.email || p.email;
      existing.phone = existing.phone || p.phone;
      existing.address = existing.address || p.address;
      existing.website = existing.website || p.website;
      existing.uberEatsUrl = existing.uberEatsUrl || p.uberEatsUrl;
      existing.deliverooUrl = existing.deliverooUrl || p.deliverooUrl;
      existing.logoUrl = existing.logoUrl || p.logoUrl;
      existing.websiteAnalysis = existing.websiteAnalysis || p.websiteAnalysis;
    }
  }

  return Array.from(map.values());
}

// ── Fuzzy matching ───────────────────────────────────────────────────────────

/**
 * Fuzzy similarity score between two strings (0 = no match, 1 = exact match).
 * Uses normalized Levenshtein distance + substring containment.
 */
export function fuzzyMatch(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);

  if (!na || !nb) return 0;
  if (na === nb) return 1;

  // Substring containment (one name is part of the other)
  if (na.includes(nb) || nb.includes(na)) {
    const shorter = Math.min(na.length, nb.length);
    const longer = Math.max(na.length, nb.length);
    return 0.5 + (shorter / longer) * 0.5; // 0.5-1.0 range
  }

  // Levenshtein distance
  const distance = levenshtein(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return Math.max(0, 1 - distance / maxLen);
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const prev = new Array<number>(n + 1);
  const curr = new Array<number>(n + 1);

  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) prev[j] = curr[j];
  }

  return prev[n];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize a string for comparison: lowercase, strip accents, non-alphanum */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Normalize for dedup: more aggressive, remove common words */
function normalizeForDedup(s: string): string {
  return normalize(s)
    .replace(/^(le|la|les|l|chez|au|aux|restaurant|resto|brasserie|cafe|boulangerie|patisserie)/g, '');
}

/** Normalize address for comparison */
function normalizeAddress(addr: string | null | undefined): string {
  if (!addr) return '';
  return addr
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(rue|avenue|av|boulevard|blvd|place|pl|impasse|imp|chemin|ch|allee|passage|quai|cours)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Extract French postal code from address string */
function extractPostalCode(addr: string | null | undefined): string | null {
  if (!addr) return null;
  const match = addr.match(/\b(\d{5})\b/);
  return match?.[1] ?? null;
}

function pick<T>(a: T | null | undefined, b: T | null | undefined): T | null {
  return a ?? b ?? null;
}

function pickLonger(a: string | null | undefined, b: string | null | undefined): string {
  const sa = a ?? '';
  const sb = b ?? '';
  return sa.length >= sb.length ? sa : sb;
}

function mergeRatings(a: number | null, b: number | null): number | null {
  if (a != null && b != null) return Math.round(((a + b) / 2) * 10) / 10;
  return a ?? b;
}

function mergeReviewCounts(a: number | null, b: number | null): number | null {
  if (a != null && b != null) return a + b;
  return a ?? b;
}
