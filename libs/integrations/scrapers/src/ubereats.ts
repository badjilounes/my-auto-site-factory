import type { Page } from 'playwright';
import { launchBrowser, scrollToLoadMore, dismissCookieBanner, randomDelay } from './browser';
import type { ScrapedBusiness, ScrapingOptions } from './types';

/**
 * Scrape UberEats restaurant listings for a French city.
 *
 * Strategy:
 * 1. Navigate to the city feed page (or search with cuisine filter)
 * 2. Scroll to load lazy content
 * 3. Extract listing cards (name, rating, cuisine, image, store URL)
 * 4. Navigate to each store detail page to get address, phone
 * 5. Deduplicate by normalized name
 *
 * Anti-bot:
 * - Random delays between requests
 * - Rotated user-agents via launchBrowser()
 * - navigator.webdriver masked
 * - Proxy support via options.proxyUrl or SCRAPER_PROXY_URL env
 */
export async function scrapeUberEats(
  city: string,
  cuisine?: string,
  options?: ScrapingOptions,
): Promise<ScrapedBusiness[]> {
  const maxResults = options?.maxResults ?? 50;
  const delayMs = options?.delayMs ?? 2000;

  const session = await launchBrowser({
    proxyUrl: options?.proxyUrl,
    timeoutMs: options?.timeoutMs,
  });

  try {
    const { page } = session;

    // UberEats FR uses /fr/city/city-slug or search
    const citySlug = city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const url = cuisine
      ? `https://www.ubereats.com/fr/category/${citySlug}?q=${encodeURIComponent(cuisine)}`
      : `https://www.ubereats.com/fr/city/${citySlug}`;

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);

    // Wait for store cards to appear
    await page
      .waitForSelector('[data-testid="store-card"], a[href*="/store/"], [class*="StoreCard"]', {
        timeout: 15000,
      })
      .catch(() => {
        // Page structure may differ, continue with what we have
      });

    // Scroll to load more listings
    await scrollToLoadMore(page, 6, delayMs);

    // Extract listing data from cards
    const listings = await extractListings(page);

    // Limit results before detail scraping
    const limited = listings.slice(0, maxResults);

    // Scrape detail pages for address + phone (with rate limiting)
    const results: ScrapedBusiness[] = [];
    for (const listing of limited) {
      try {
        const detail = await scrapeDetailPage(page, listing.detailUrl, delayMs);
        results.push({
          name: listing.name,
          address: detail.address || '',
          city,
          phone: detail.phone,
          email: null, // UberEats doesn't expose emails
          website: null,
          cuisine: listing.cuisine,
          rating: listing.rating,
          reviewCount: listing.reviewCount,
          priceRange: listing.priceRange,
          imageUrl: listing.imageUrl,
          sourceUrl: listing.detailUrl,
          source: 'ubereats',
        });
      } catch {
        // If detail page fails, keep what we have from the listing
        results.push({
          name: listing.name,
          address: '',
          city,
          phone: null,
          email: null,
          website: null,
          cuisine: listing.cuisine,
          rating: listing.rating,
          reviewCount: listing.reviewCount,
          priceRange: listing.priceRange,
          imageUrl: listing.imageUrl,
          sourceUrl: listing.detailUrl,
          source: 'ubereats',
        });
      }
    }

    return deduplicateByName(results);
  } finally {
    await session.close();
  }
}

// ── Internals ────────────────────────────────────────────────────────────────

interface ListingCard {
  name: string;
  cuisine: string;
  rating: number | null;
  reviewCount: number | null;
  priceRange: string | null;
  imageUrl: string | null;
  detailUrl: string;
}

async function extractListings(page: Page): Promise<ListingCard[]> {
  return page.evaluate(() => {
    const cards: {
      name: string;
      cuisine: string;
      rating: number | null;
      reviewCount: number | null;
      priceRange: string | null;
      imageUrl: string | null;
      detailUrl: string;
    }[] = [];

    // UberEats renders store cards as <a> tags linking to /store/slug
    const links = document.querySelectorAll('a[href*="/store/"]');

    const seen = new Set<string>();

    links.forEach((link) => {
      const href = (link as HTMLAnchorElement).href;
      // Skip duplicates (same link appearing multiple times in DOM)
      if (seen.has(href)) return;
      seen.add(href);

      // Name: typically the first h3 or prominent text
      const nameEl =
        link.querySelector('h3') ??
        link.querySelector('[data-testid="store-card-title"]') ??
        link.querySelector('span[class*="name" i]');
      const name = nameEl?.textContent?.trim() ?? '';
      if (!name || name.length < 2) return;

      // Rating: look for a pattern like "4.5" or "(4.5)"
      const text = link.textContent ?? '';
      const ratingMatch = text.match(/(\d\.\d)\s*\((\d+)\+?\)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
      const reviewCount = ratingMatch ? parseInt(ratingMatch[2], 10) : null;

      // Price range: $ signs or € signs
      const priceMatch = text.match(/([$€]{1,4})/);
      const priceRange = priceMatch ? priceMatch[1] : null;

      // Cuisine: tags/metadata - small spans that aren't ratings/prices/times
      const spans = link.querySelectorAll('span, div');
      let cuisine = '';
      spans.forEach((el) => {
        const t = el.textContent?.trim() ?? '';
        if (
          t.length > 2 &&
          t.length < 40 &&
          !t.match(/^\d/) &&
          !t.match(/^[$€]/) &&
          !t.includes('min') &&
          !t.includes('Livraison') &&
          !t.includes('Frais') &&
          t !== name &&
          !cuisine
        ) {
          cuisine = t;
        }
      });

      // Image
      const img = link.querySelector('img');
      const imageUrl = img?.src ?? img?.getAttribute('data-src') ?? null;

      cards.push({
        name,
        cuisine,
        rating,
        reviewCount,
        priceRange,
        imageUrl,
        detailUrl: href,
      });
    });

    return cards;
  });
}

async function scrapeDetailPage(
  page: Page,
  url: string,
  delayMs: number,
): Promise<{ address: string | null; phone: string | null }> {
  await page.waitForTimeout(randomDelay(delayMs));
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Wait for content to settle
  await page.waitForTimeout(2000);

  return page.evaluate(() => {
    const body = document.body.textContent ?? '';

    // Address: look for French address patterns (number + street + postal code)
    const addressMatch = body.match(
      /(\d{1,4}[\s,]+(?:rue|avenue|boulevard|place|impasse|chemin|allée|passage|quai|cours)\s[^,\n]{3,60}(?:,?\s*\d{5}\s+\w+)?)/i,
    );
    const address = addressMatch?.[1]?.trim() ?? null;

    // Phone: French phone patterns (01-09, +33)
    const phoneMatch = body.match(
      /(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/,
    );
    const phone = phoneMatch?.[0]?.trim() ?? null;

    return { address, phone };
  });
}

function deduplicateByName(items: ScrapedBusiness[]): ScrapedBusiness[] {
  const seen = new Map<string, ScrapedBusiness>();
  for (const item of items) {
    const key = item.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    // Keep the entry with more data
    const existing = seen.get(key);
    if (!existing || scoreCompleteness(item) > scoreCompleteness(existing)) {
      seen.set(key, item);
    }
  }
  return Array.from(seen.values());
}

function scoreCompleteness(b: ScrapedBusiness): number {
  let score = 0;
  if (b.name) score++;
  if (b.address) score++;
  if (b.phone) score++;
  if (b.email) score++;
  if (b.rating) score++;
  if (b.imageUrl) score++;
  if (b.cuisine) score++;
  return score;
}
