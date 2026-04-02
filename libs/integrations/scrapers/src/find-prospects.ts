import { scrapeUberEats } from './ubereats';
import { scrapeDeliveroo } from './deliveroo';
import { analyzeWebsite } from './website-analyzer';
import { reconcileBusinessData } from './reconciliation';
import type { ReconciledProspect, ScrapingOptions, WebsiteAnalysis } from './types';

/**
 * Main entry point: find prospects in a city by scraping multiple platforms
 * and reconciling the results into deduplicated, enriched prospects.
 *
 * Pipeline:
 * 1. Scrape UberEats + Deliveroo in parallel
 * 2. Reconcile (fuzzy match + dedup)
 * 3. Optionally analyze found websites
 * 4. Return enriched, deduplicated prospects sorted by confidence
 *
 * @param city - City name (e.g. "Paris", "Lyon", "Marseille")
 * @param category - Optional cuisine filter (e.g. "pizza", "sushi", "burger")
 * @param options - Scraping options (maxResults, delays, proxy, etc.)
 * @returns Deduplicated prospect array sorted by confidence (highest first)
 */
export async function findAndReconcileProspects(
  city: string,
  category?: string,
  options?: ScrapingOptions,
): Promise<ReconciledProspect[]> {
  const opts: ScrapingOptions = {
    maxResults: 50,
    delayMs: 2000,
    analyzeWebsites: true,
    timeoutMs: 30000,
    ...options,
  };

  // ── Step 1: Scrape both platforms in parallel
  const [uberEatsResult, deliverooResult] = await Promise.allSettled([
    scrapeUberEats(city, category, opts),
    scrapeDeliveroo(city, category, opts),
  ]);

  const uberEatsData = uberEatsResult.status === 'fulfilled' ? uberEatsResult.value : [];
  const deliverooData = deliverooResult.status === 'fulfilled' ? deliverooResult.value : [];

  // Log failures but don't crash — we still process whatever we got
  if (uberEatsResult.status === 'rejected') {
    console.warn(`[Scraper] UberEats failed for ${city}: ${uberEatsResult.reason}`);
  }
  if (deliverooResult.status === 'rejected') {
    console.warn(`[Scraper] Deliveroo failed for ${city}: ${deliverooResult.reason}`);
  }

  // If both failed, throw
  if (uberEatsData.length === 0 && deliverooData.length === 0) {
    const errors = [
      uberEatsResult.status === 'rejected' ? `UberEats: ${uberEatsResult.reason}` : null,
      deliverooResult.status === 'rejected' ? `Deliveroo: ${deliverooResult.reason}` : null,
    ]
      .filter(Boolean)
      .join('; ');
    throw new Error(`No results for "${city}". Errors: ${errors || 'No listings found'}`);
  }

  // ── Step 2: Reconcile
  let websiteAnalyses: Map<string, WebsiteAnalysis> | undefined;

  // ── Step 3: Optionally analyze websites found in the scraped data
  if (opts.analyzeWebsites) {
    // Collect unique website URLs from scraped data
    const websiteUrls = new Set<string>();
    for (const b of [...uberEatsData, ...deliverooData]) {
      if (b.website) websiteUrls.add(b.website);
    }

    if (websiteUrls.size > 0) {
      websiteAnalyses = new Map();
      // Analyze in parallel with a concurrency limit of 5
      const urls = Array.from(websiteUrls);
      const batchSize = 5;

      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map((url) => analyzeWebsite(url)));

        results.forEach((result, idx) => {
          if (result.status === 'fulfilled') {
            websiteAnalyses!.set(batch[idx], result.value);
          }
        });
      }
    }
  }

  const prospects = reconcileBusinessData(uberEatsData, deliverooData, websiteAnalyses);

  // ── Step 4: Sort by confidence (highest first), then by data completeness
  prospects.sort((a, b) => {
    const confDiff = b.confidence - a.confidence;
    if (Math.abs(confDiff) > 0.05) return confDiff;
    // Tiebreak: prefer prospects with more contact data
    return completenessScore(b) - completenessScore(a);
  });

  return prospects;
}

function completenessScore(p: ReconciledProspect): number {
  let score = 0;
  if (p.businessName) score++;
  if (p.address) score++;
  if (p.phone) score += 2; // Phone is very valuable for outreach
  if (p.email) score += 2; // Email is very valuable for outreach
  if (p.website) score++;
  if (p.rating) score++;
  if (p.cuisineType) score++;
  if (p.logoUrl) score++;
  if (p.uberEatsUrl) score++;
  if (p.deliverooUrl) score++;
  return score;
}
