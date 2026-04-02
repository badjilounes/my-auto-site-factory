import { chromium, type Browser, type Page } from 'playwright';

export interface ScrapedBusiness {
  name: string;
  address: string;
  cuisine: string;
  rating: number | null;
  priceRange: string | null;
  imageUrl: string | null;
}

export async function scrapeUberEats(
  city: string,
  cuisine?: string
): Promise<ScrapedBusiness[]> {
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });
    const page: Page = await context.newPage();

    // Build the URL for the city feed
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const baseUrl = `https://www.ubereats.com/city/${citySlug}`;
    const url = cuisine
      ? `${baseUrl}?q=${encodeURIComponent(cuisine)}`
      : baseUrl;

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for restaurant cards to load
    await page.waitForSelector('[data-testid="store-card"], a[href*="/store/"]', {
      timeout: 15000,
    }).catch(() => {
      // Cards may not appear if the page structure differs
    });

    // Scroll down to load more results
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1500);
    }

    // Extract business data from store cards
    const businesses = await page.evaluate(() => {
      const results: {
        name: string;
        address: string;
        cuisine: string;
        rating: number | null;
        priceRange: string | null;
        imageUrl: string | null;
      }[] = [];

      // Try multiple possible selectors for store cards
      const cards = document.querySelectorAll(
        '[data-testid="store-card"], [class*="StoreCard"], a[href*="/store/"]'
      );

      cards.forEach((card) => {
        const nameEl =
          card.querySelector('h3') ??
          card.querySelector('[data-testid="store-card-title"]') ??
          card.querySelector('[class*="StoreName"]');

        const name = nameEl?.textContent?.trim() ?? '';
        if (!name) return;

        // Extract rating (e.g., "4.5")
        const ratingEl = card.querySelector(
          '[class*="rating"], [class*="Rating"], [data-testid*="rating"]'
        );
        const ratingText = ratingEl?.textContent?.trim() ?? '';
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

        // Extract price range (e.g., "$", "$$", "$$$")
        const priceEl = card.querySelector(
          '[class*="price"], [class*="Price"]'
        );
        const priceText = priceEl?.textContent?.trim() ?? '';
        const priceMatch = priceText.match(/(\$+)/);
        const priceRange = priceMatch ? priceMatch[1] : null;

        // Extract cuisine/category info
        const metaEls = card.querySelectorAll(
          'span, [class*="category"], [class*="Category"]'
        );
        let cuisineText = '';
        metaEls.forEach((el) => {
          const text = el.textContent?.trim() ?? '';
          if (
            text &&
            !text.match(/^\d/) &&
            !text.match(/^\$/) &&
            !text.includes('min') &&
            !text.includes('Delivery') &&
            text.length > 2 &&
            text.length < 50
          ) {
            if (!cuisineText) cuisineText = text;
          }
        });

        // Extract image
        const imgEl = card.querySelector('img');
        const imageUrl = imgEl?.getAttribute('src') ?? null;

        results.push({
          name,
          address: '', // Uber Eats doesn't typically show full addresses on listing pages
          cuisine: cuisineText,
          rating,
          priceRange,
          imageUrl,
        });
      });

      return results;
    });

    await browser.close();
    browser = null;

    // Deduplicate by name
    const seen = new Set<string>();
    const deduplicated = businesses.filter((b: ScrapedBusiness) => {
      const key = b.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return deduplicated;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to scrape Uber Eats for city "${city}": ${message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
