import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ScrapingJobData {
  source: 'UBEREATS' | 'DELIVEROO';
  city: string;
  cuisine?: string;
  scrapingJobId: string;
}

interface ScrapedRestaurant {
  businessName: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  cuisine?: string;
  rating?: number;
  reviewCount?: number;
  priceRange?: string;
  description?: string;
  logoUrl?: string;
  openingHours?: Record<string, string>;
  sourceUrl: string;
}

/**
 * Scrape UberEats listings for restaurants in the given city/cuisine.
 * In production this would use Puppeteer or a scraping API.
 */
async function scrapeUberEats(
  city: string,
  cuisine?: string
): Promise<ScrapedRestaurant[]> {
  // TODO: Implement real UberEats scraping logic (Puppeteer / scraping API)
  console.log(`[scraper] Scraping UberEats for city=${city}, cuisine=${cuisine ?? 'all'}`);

  // Placeholder: returns empty array until real scraper is implemented
  return [];
}

/**
 * Scrape Deliveroo listings for restaurants in the given city/cuisine.
 * In production this would use Puppeteer or a scraping API.
 */
async function scrapeDeliveroo(
  city: string,
  cuisine?: string
): Promise<ScrapedRestaurant[]> {
  // TODO: Implement real Deliveroo scraping logic (Puppeteer / scraping API)
  console.log(`[scraper] Scraping Deliveroo for city=${city}, cuisine=${cuisine ?? 'all'}`);

  // Placeholder: returns empty array until real scraper is implemented
  return [];
}

/**
 * Reconcile scraped data from multiple sources. If a restaurant already exists
 * (matched by name + city), merge data to fill in missing fields.
 */
function reconcileData(
  existingProspect: {
    email: string | null;
    phone: string | null;
    address: string | null;
    website: string | null;
    logoUrl: string | null;
    description: string | null;
    rating: number | null;
    reviewCount: number | null;
    priceRange: string | null;
    openingHours: unknown;
  },
  scraped: ScrapedRestaurant
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  if (!existingProspect.email && scraped.email) updates.email = scraped.email;
  if (!existingProspect.phone && scraped.phone) updates.phone = scraped.phone;
  if (!existingProspect.address && scraped.address) updates.address = scraped.address;
  if (!existingProspect.website && scraped.website) updates.website = scraped.website;
  if (!existingProspect.logoUrl && scraped.logoUrl) updates.logoUrl = scraped.logoUrl;
  if (!existingProspect.description && scraped.description) updates.description = scraped.description;
  if (!existingProspect.rating && scraped.rating) updates.rating = scraped.rating;
  if (!existingProspect.reviewCount && scraped.reviewCount) updates.reviewCount = scraped.reviewCount;
  if (!existingProspect.priceRange && scraped.priceRange) updates.priceRange = scraped.priceRange;
  if (!existingProspect.openingHours && scraped.openingHours) {
    updates.openingHours = scraped.openingHours;
  }

  return updates;
}

export async function processScrapingJob(job: Job<ScrapingJobData>): Promise<void> {
  const { source, city, cuisine, scrapingJobId } = job.data;

  // Mark the scraping job as running
  await prisma.scrapingJob.update({
    where: { id: scrapingJobId },
    data: { status: 'RUNNING', startedAt: new Date() },
  });

  try {
    // Call the appropriate scraper
    let results: ScrapedRestaurant[];
    if (source === 'UBEREATS') {
      results = await scrapeUberEats(city, cuisine);
    } else {
      results = await scrapeDeliveroo(city, cuisine);
    }

    console.log(`[scraper] Found ${results.length} restaurants from ${source} in ${city}`);

    let processedCount = 0;

    for (const restaurant of results) {
      // Check if prospect already exists (by name + city)
      const existing = await prisma.prospect.findFirst({
        where: {
          businessName: restaurant.businessName,
          city: city,
        },
      });

      if (existing) {
        // Reconcile / merge data from this new source
        const updates = reconcileData(existing, restaurant);

        // Also update the source-specific URL
        if (source === 'UBEREATS') {
          updates.uberEatsUrl = restaurant.sourceUrl;
        } else {
          updates.deliverooUrl = restaurant.sourceUrl;
        }

        if (Object.keys(updates).length > 0) {
          await prisma.prospect.update({
            where: { id: existing.id },
            data: {
              ...updates,
              status: existing.status === 'NEW' ? 'ENRICHED' : existing.status,
            },
          });
        }
      } else {
        // Create a new prospect
        await prisma.prospect.create({
          data: {
            businessName: restaurant.businessName,
            email: restaurant.email ?? null,
            phone: restaurant.phone ?? null,
            address: restaurant.address ?? null,
            city: city,
            website: restaurant.website ?? null,
            uberEatsUrl: source === 'UBEREATS' ? restaurant.sourceUrl : null,
            deliverooUrl: source === 'DELIVEROO' ? restaurant.sourceUrl : null,
            logoUrl: restaurant.logoUrl ?? null,
            description: restaurant.description ?? null,
            cuisine: restaurant.cuisine ?? cuisine ?? null,
            openingHours: restaurant.openingHours ?? undefined,
            rating: restaurant.rating ?? null,
            reviewCount: restaurant.reviewCount ?? null,
            priceRange: restaurant.priceRange ?? null,
            status: 'NEW',
          },
        });
      }

      processedCount++;

      // Report progress
      await job.updateProgress(Math.round((processedCount / results.length) * 100));
    }

    // Mark scraping job as completed
    await prisma.scrapingJob.update({
      where: { id: scrapingJobId },
      data: {
        status: 'COMPLETED',
        resultCount: processedCount,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Mark scraping job as failed
    await prisma.scrapingJob.update({
      where: { id: scrapingJobId },
      data: {
        status: 'FAILED',
        error: errorMessage,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}
