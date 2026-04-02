import * as cheerio from 'cheerio';

export interface WebsiteAnalysis {
  url: string;
  title: string | null;
  description: string | null;
  hasModernDesign: boolean;
  lastUpdated: string | null;
  contactInfo: {
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  socialLinks: {
    facebook: string | null;
    instagram: string | null;
    twitter: string | null;
    linkedin: string | null;
    yelp: string | null;
  };
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $('meta[property="og:title"]').attr('content') ??
      $('title').first().text().trim() ??
      null;

    // Extract description
    const description =
      $('meta[name="description"]').attr('content') ??
      $('meta[property="og:description"]').attr('content') ??
      null;

    // Detect modern design signals
    const hasViewport = $('meta[name="viewport"]').length > 0;
    const htmlContent = html.toLowerCase();
    const hasFlexbox =
      htmlContent.includes('display:flex') ||
      htmlContent.includes('display: flex');
    const hasGrid =
      htmlContent.includes('display:grid') ||
      htmlContent.includes('display: grid');
    const hasMediaQueries = htmlContent.includes('@media');
    const hasTailwind =
      htmlContent.includes('tailwind') ||
      htmlContent.includes('tw-');
    const hasBootstrap = htmlContent.includes('bootstrap');
    const hasModernFramework =
      htmlContent.includes('__next') ||
      htmlContent.includes('__nuxt') ||
      htmlContent.includes('gatsby') ||
      htmlContent.includes('react');

    const modernSignals = [
      hasViewport,
      hasFlexbox,
      hasGrid,
      hasMediaQueries,
      hasTailwind,
      hasBootstrap,
      hasModernFramework,
    ];
    const modernScore = modernSignals.filter(Boolean).length;
    const hasModernDesign = modernScore >= 3;

    // Extract last updated from meta tags
    const lastUpdated =
      $('meta[name="last-modified"]').attr('content') ??
      $('meta[property="article:modified_time"]').attr('content') ??
      $('meta[name="date"]').attr('content') ??
      $('meta[http-equiv="last-modified"]').attr('content') ??
      null;

    // Extract contact information
    const bodyText = $('body').text();

    // Find email addresses
    const emailMatch = bodyText.match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    );
    const emailFromHref = $('a[href^="mailto:"]')
      .first()
      .attr('href')
      ?.replace('mailto:', '')
      ?.split('?')[0];
    const email = emailFromHref ?? emailMatch?.[0] ?? null;

    // Find phone numbers
    const phoneFromHref = $('a[href^="tel:"]')
      .first()
      .attr('href')
      ?.replace('tel:', '');
    const phoneMatch = bodyText.match(
      /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
    );
    const phone = phoneFromHref ?? phoneMatch?.[0]?.trim() ?? null;

    // Find address (look for common address patterns or structured data)
    const addressSchema = $('[itemprop="address"], [itemtype*="PostalAddress"]')
      .first()
      .text()
      .trim();
    const addressEl = $(
      '.address, #address, [class*="address"], [class*="Address"], [data-testid*="address"]'
    )
      .first()
      .text()
      .trim();
    const address = addressSchema || addressEl || null;

    // Extract social links
    const allLinks = $('a[href]')
      .map((_: number, el: cheerio.AnyNode) => $(el).attr('href'))
      .get()
      .filter((href: string | undefined): href is string => typeof href === 'string');

    const findSocialLink = (patterns: string[]): string | null => {
      for (const link of allLinks) {
        for (const pattern of patterns) {
          if (link.includes(pattern)) return link;
        }
      }
      return null;
    };

    const socialLinks = {
      facebook: findSocialLink(['facebook.com', 'fb.com']),
      instagram: findSocialLink(['instagram.com']),
      twitter: findSocialLink(['twitter.com', 'x.com']),
      linkedin: findSocialLink(['linkedin.com']),
      yelp: findSocialLink(['yelp.com']),
    };

    return {
      url,
      title: title || null,
      description: description || null,
      hasModernDesign,
      lastUpdated,
      contactInfo: {
        email,
        phone,
        address: address || null,
      },
      socialLinks,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to analyze website "${url}": ${message}`);
  }
}
