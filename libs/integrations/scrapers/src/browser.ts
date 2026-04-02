import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
];

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export interface BrowserSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
}

/**
 * Launch a stealth browser session with anti-detection measures.
 * Rotates user-agent, sets realistic viewport, blocks unnecessary resources.
 */
export async function launchBrowser(options?: {
  proxyUrl?: string;
  timeoutMs?: number;
}): Promise<BrowserSession> {
  const launchOptions: Parameters<typeof chromium.launch>[0] = {
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
    ],
  };

  // Proxy support: set PROXY_URL env or pass proxyUrl option
  // Example: http://user:pass@proxy.example.com:8080
  const proxyUrl = options?.proxyUrl || process.env['SCRAPER_PROXY_URL'];
  if (proxyUrl) {
    launchOptions.proxy = { server: proxyUrl };
  }

  const browser = await chromium.launch(launchOptions);

  const context = await browser.newContext({
    userAgent: randomUserAgent(),
    viewport: { width: 1366, height: 768 },
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    geolocation: { latitude: 48.8566, longitude: 2.3522 },
    permissions: ['geolocation'],
    // Block images and fonts for faster scraping
    bypassCSP: true,
  });

  // Mask navigator.webdriver
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    // Mask chrome automation indicators
    (window as any).chrome = { runtime: {} };
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });
    Object.defineProperty(navigator, 'languages', {
      get: () => ['fr-FR', 'fr', 'en-US', 'en'],
    });
  });

  // Block heavy resources to speed up scraping
  await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf}', (route) =>
    route.abort(),
  );

  const page = await context.newPage();
  page.setDefaultTimeout(options?.timeoutMs ?? 30000);

  return {
    browser,
    context,
    page,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

/**
 * Wait a random delay to mimic human behavior.
 */
export function randomDelay(baseMs: number): number {
  return baseMs + Math.floor(Math.random() * baseMs * 0.5);
}

/**
 * Scroll the page progressively to trigger lazy-loading.
 */
export async function scrollToLoadMore(page: Page, scrollCount = 5, delayMs = 1500): Promise<void> {
  for (let i = 0; i < scrollCount; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(randomDelay(delayMs));
  }
}

/**
 * Dismiss cookie consent banners (common patterns).
 */
export async function dismissCookieBanner(page: Page): Promise<void> {
  const selectors = [
    'button[id*="accept"]',
    'button[class*="accept"]',
    'button[data-testid="accept-button"]',
    'button:has-text("Accepter")',
    'button:has-text("Accept all")',
    'button:has-text("Tout accepter")',
    'button:has-text("J\'accepte")',
    '#onetrust-accept-btn-handler',
    '.cookie-consent-accept',
  ];

  for (const selector of selectors) {
    try {
      const btn = await page.waitForSelector(selector, { timeout: 3000 });
      if (btn) {
        await btn.click();
        await page.waitForTimeout(500);
        return;
      }
    } catch {
      // Selector not found, try next
    }
  }
}
