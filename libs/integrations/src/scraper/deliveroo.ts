import { chromium, type Browser, type Page } from 'playwright';

export interface ScrapedBusiness {
  name: string;
  address: string;
  cuisine: string;
  rating: number | null;
  priceRange: string | null;
  imageUrl: string | null;
}

export async function scrapeDeliveroo(
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

    // Build the Deliveroo URL
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const baseUrl = `https://deliveroo.co.uk/restaurants/${citySlug}`;
    const url = cuisine
      ? `${baseUrl}?q=${encodeURIComponent(cuisine)}`
      : baseUrl;

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Accept cookies if the banner appears
    const cookieButton = await page
      .waitForSelector(
        'button[data-test-id="accept-button"], button:has-text("Accept")',
        { timeout: 5000 }
      )
      .catch(() => null);
    if (cookieButton) {
      await cookieButton.click();
      await page.waitForTimeout(1000);
    }

    // Wait for restaurant listings to load
    await page
      .waitForSelector(
        '[data-test-id="restaurant-tile"], [class*="RestaurantCard"], a[href*="/menu/"]',
        { timeout: 15000 }
      )
      .catch(() => {
        // Cards may not appear if the page structure differs
      });

    // Scroll down to load more results
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout(1500);
    }

    // Extract business data from restaurant tiles
    const businesses = await page.evaluate(() => {
      const results: {
        name: string;
        address: string;
        cuisine: string;
        rating: number | null;
        priceRange: string | null;
        imageUrl: string | null;
      }[] = [];

      const cards = document.querySelectorAll(
        '[data-test-id="restaurant-tile"], [class*="RestaurantCard"], a[href*="/menu/"]'
      );

      cards.forEach((card) => {
        const nameEl =
          card.querySelector('p[data-test-id="restaurant-name"]') ??
          card.querySelector('h3') ??
          card.querySelector('[class*="RestaurantName"]') ??
          card.querySelector('p:first-of-type');

        const name = nameEl?.textContent?.trim() ?? '';
        if (!name) return;

        // Extract rating
        const ratingEl = card.querySelector(
          '[data-test-id="restaurant-rating"], [class*="rating"], [class*="Rating"]'
        );
        const ratingText = ratingEl?.textContent?.trim() ?? '';
        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
        const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

        // Extract cuisine/category tags
        const tagEls = card.querySelectorAll(
          '[class*="tag"], [class*="Tag"], [class*="cuisine"], [class*="category"]'
        );
        const cuisineParts: string[] = [];
        tagEls.forEach((el) => {
          const text = el.textContent?.trim() ?? '';
          if (
            text &&
            !text.match(/^\d/) &&
            !text.includes('min') &&
            !text.includes('Delivery') &&
            text.length > 1 &&
            text.length < 50
          ) {
            cuisineParts.push(text);
          }
        });
        const cuisineText = cuisineParts.join(', ');

        // Extract price range from text content (e.g., GBP signs or $ signs)
        const fullText = card.textContent ?? '';
        const priceMatch = fullText.match(/([\u00A3$]{1,3})/);
        const priceRange = priceMatch ? priceMatch[1] : null;

        // Extract image
        const imgEl = card.querySelector('img');
        const imageUrl = imgEl?.getAttribute('src') ?? null;

        results.push({
          name,
          address: '', // Deliveroo doesn't typically show full addresses on listing pages
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
    throw new Error(
      `Failed to scrape Deliveroo for city "${city}": ${message}`
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
