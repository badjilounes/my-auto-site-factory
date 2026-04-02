import type { Page } from 'playwright';
import { launchBrowser, scrollToLoadMore, dismissCookieBanner, randomDelay } from './browser';
import type { ScrapedBusiness, ScrapingOptions } from './types';

/**
 * Scrape Deliveroo restaurant listings for a French city.
 *
 * Strategy:
 * 1. Navigate to deliveroo.fr/restaurants/city-slug (+ cuisine filter)
 * 2. Dismiss cookie banner
 * 3. Scroll to lazy-load all tiles
 * 4. Extract restaurant cards (name, cuisine, rating, image, menu URL)
 * 5. Visit each detail page to get address + phone
 * 6. Deduplicate
 *
 * Anti-bot: same protections as UberEats scraper (see browser.ts)
 */
export async function scrapeDeliveroo(
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

    const citySlug = city
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Deliveroo FR
    let url = `https://deliveroo.fr/fr/restaurants/${citySlug}`;
    if (cuisine) {
      url += `?q=${encodeURIComponent(cuisine)}`;
    }

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await dismissCookieBanner(page);

    // Wait for restaurant tiles
    await page
      .waitForSelector(
        '[data-test-id="restaurant-tile"], a[href*="/menu/"], [class*="RestaurantCard"]',
        { timeout: 15000 },
      )
      .catch(() => {
        // Structure may differ
      });

    await scrollToLoadMore(page, 6, delayMs);

    const listings = await extractListings(page);
    const limited = listings.slice(0, maxResults);

    // Scrape detail pages
    const results: ScrapedBusiness[] = [];
    for (const listing of limited) {
      try {
        const detail = await scrapeDetailPage(page, listing.detailUrl, delayMs);
        results.push({
          name: listing.name,
          address: detail.address || '',
          city,
          phone: detail.phone,
          email: null,
          website: null,
          cuisine: listing.cuisine,
          rating: listing.rating,
          reviewCount: listing.reviewCount,
          priceRange: listing.priceRange,
          imageUrl: listing.imageUrl,
          sourceUrl: listing.detailUrl,
          source: 'deliveroo',
        });
      } catch {
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
          source: 'deliveroo',
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

    // Deliveroo menu links: /fr/menu/city/restaurant-slug
    const links = document.querySelectorAll('a[href*="/menu/"]');
    const seen = new Set<string>();

    links.forEach((link) => {
      const href = (link as HTMLAnchorElement).href;
      if (seen.has(href)) return;
      seen.add(href);

      // Name
      const nameEl =
        link.querySelector('p[data-test-id="restaurant-name"]') ??
        link.querySelector('h3') ??
        link.querySelector('[class*="RestaurantName"]') ??
        link.querySelector('p:first-of-type');
      const name = nameEl?.textContent?.trim() ?? '';
      if (!name || name.length < 2) return;

      const text = link.textContent ?? '';

      // Rating: "4.5 Excellent (200+)"
      const ratingMatch = text.match(/(\d\.\d)\s*(?:\w+\s*)?\((\d+)\+?\)/);
      const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
      const reviewCount = ratingMatch ? parseInt(ratingMatch[2], 10) : null;

      // Cuisine tags
      const tagEls = link.querySelectorAll(
        '[class*="tag" i], [class*="cuisine" i], [class*="category" i], span',
      );
      const cuisineParts: string[] = [];
      tagEls.forEach((el) => {
        const t = el.textContent?.trim() ?? '';
        if (
          t.length > 2 &&
          t.length < 40 &&
          !t.match(/^\d/) &&
          !t.includes('min') &&
          !t.includes('Livraison') &&
          !t.includes('Gratuit') &&
          t !== name &&
          cuisineParts.length < 3
        ) {
          cuisineParts.push(t);
        }
      });

      // Price range
      const priceMatch = text.match(/(€{1,4})/);
      const priceRange = priceMatch ? priceMatch[1] : null;

      // Image
      const img = link.querySelector('img');
      const imageUrl = img?.src ?? img?.getAttribute('data-src') ?? null;

      cards.push({
        name,
        cuisine: cuisineParts.join(', '),
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
  await page.waitForTimeout(2000);

  return page.evaluate(() => {
    const body = document.body.textContent ?? '';

    // Address: French street patterns
    const addressMatch = body.match(
      /(\d{1,4}[\s,]+(?:rue|avenue|boulevard|place|impasse|chemin|allée|passage|quai|cours)\s[^,\n]{3,60}(?:,?\s*\d{5}\s+\w+)?)/i,
    );
    const address = addressMatch?.[1]?.trim() ?? null;

    // Phone: French formats
    const phoneMatch = body.match(/(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}/);
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
  if (b.rating) score++;
  if (b.imageUrl) score++;
  if (b.cuisine) score++;
  return score;
}
