/**
 * Core logic for syncing scraped prospects into the database.
 *
 * For each ReconciledProspect from the scraper:
 * 1. Search for an existing prospect by name + city (fuzzy)
 * 2. If found → update with new data (merge, don't overwrite non-null fields)
 * 3. If not found → create a new prospect
 * 4. Track stats (created, updated, skipped)
 */

import {
  prospectRepository,
  scrapingJobRepository,
  scrapingResultRepository,
  prisma,
} from '@my-auto-site-factory/core-database';
import type { ReconciledProspect } from '@my-auto-site-factory/integrations-scrapers';

export interface SyncStats {
  created: number;
  updated: number;
  skipped: number;
  total: number;
  durationMs: number;
}

/**
 * Sync a batch of reconciled prospects into the database.
 * Uses upsert logic: update if exists (by name + city), create otherwise.
 */
export async function syncProspectsToDb(
  prospects: ReconciledProspect[],
  scrapingJobId?: string,
): Promise<SyncStats> {
  const start = Date.now();
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const prospect of prospects) {
    try {
      // Search by normalized business name + city
      const existing = await prisma.prospect.findFirst({
        where: {
          businessName: { contains: prospect.businessName, mode: 'insensitive' },
          city: { equals: prospect.city, mode: 'insensitive' },
        },
      });

      if (existing) {
        // Merge: only update fields that are null in DB but present in scraped data
        const updateData = buildUpdateData(existing, prospect);

        if (Object.keys(updateData).length > 0) {
          await prospectRepository.update(existing.id, updateData);
          updated++;
        } else {
          skipped++;
        }

        // Save scraping result linked to existing prospect
        if (scrapingJobId) {
          await saveScrapingResult(prospect, scrapingJobId, existing.id);
        }
      } else {
        // Create new prospect
        const newProspect = await prospectRepository.create({
          businessName: prospect.businessName,
          ownerName: prospect.ownerName,
          email: prospect.email,
          phone: prospect.phone,
          address: prospect.address || '',
          city: prospect.city,
          postalCode: prospect.postalCode,
          website: prospect.website,
          uberEatsUrl: prospect.uberEatsUrl,
          deliverooUrl: prospect.deliverooUrl,
          logoUrl: prospect.logoUrl,
          description: prospect.description,
          cuisineType: prospect.cuisineType || '',
          openingHours: prospect.openingHours ?? undefined,
          rating: prospect.rating,
          priceRange: prospect.priceRange,
          source: prospect.source,
          sourceUrl: prospect.sourceUrl,
          status: 'NEW',
        });

        created++;

        // Save scraping result linked to new prospect
        if (scrapingJobId) {
          await saveScrapingResult(prospect, scrapingJobId, newProspect.id);
        }
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[ProspectSync] Failed to sync "${prospect.businessName}": ${msg}`);
      skipped++;
    }
  }

  const durationMs = Date.now() - start;

  // Update scraping job stats if provided
  if (scrapingJobId) {
    await scrapingJobRepository.markCompleted(scrapingJobId, prospects.length);
  }

  return { created, updated, skipped, total: prospects.length, durationMs };
}

/**
 * Build an update object that only fills in missing data (never overwrites existing values).
 */
function buildUpdateData(
  existing: Record<string, unknown>,
  scraped: ReconciledProspect,
): Record<string, unknown> {
  const updates: Record<string, unknown> = {};

  // Only update if the existing field is empty/null and the scraped value is present
  if (!existing['email'] && scraped.email) updates['email'] = scraped.email;
  if (!existing['phone'] && scraped.phone) updates['phone'] = scraped.phone;
  if (!existing['website'] && scraped.website) updates['website'] = scraped.website;
  if (!existing['address'] && scraped.address) updates['address'] = scraped.address;
  if (!existing['postalCode'] && scraped.postalCode) updates['postalCode'] = scraped.postalCode;
  if (!existing['logoUrl'] && scraped.logoUrl) updates['logoUrl'] = scraped.logoUrl;
  if (!existing['description'] && scraped.description) updates['description'] = scraped.description;
  if (!existing['uberEatsUrl'] && scraped.uberEatsUrl) updates['uberEatsUrl'] = scraped.uberEatsUrl;
  if (!existing['deliverooUrl'] && scraped.deliverooUrl) updates['deliverooUrl'] = scraped.deliverooUrl;
  if (!existing['openingHours'] && scraped.openingHours) updates['openingHours'] = scraped.openingHours;

  // Always update rating/reviewCount if we have newer data
  if (scraped.rating != null) updates['rating'] = scraped.rating;
  if (scraped.reviewCount != null) updates['reviewCount'] = scraped.reviewCount;
  if (scraped.priceRange) updates['priceRange'] = scraped.priceRange;

  // Enrich status if currently NEW
  if (existing['status'] === 'NEW' && Object.keys(updates).length > 0) {
    updates['status'] = 'ENRICHED';
  }

  return updates;
}

/**
 * Save raw scraping result for traceability.
 */
async function saveScrapingResult(
  prospect: ReconciledProspect,
  scrapingJobId: string,
  prospectId: string,
): Promise<void> {
  try {
    await scrapingResultRepository.create({
      scrapingJob: { connect: { id: scrapingJobId } },
      prospect: { connect: { id: prospectId } },
      source: prospect.source.split(',')[0].toUpperCase() as any,
      sourceUrl: prospect.sourceUrl,
      name: prospect.businessName,
      address: prospect.address || undefined,
      city: prospect.city || undefined,
      phone: prospect.phone || undefined,
      email: prospect.email || undefined,
      website: prospect.website || undefined,
      cuisineType: prospect.cuisineType || undefined,
      rating: prospect.rating ?? undefined,
      priceRange: prospect.priceRange || undefined,
      imageUrls: prospect.logoUrl ? [prospect.logoUrl] : [],
      rawData: JSON.parse(JSON.stringify({
        confidence: prospect.confidence,
        sources: prospect.source,
        websiteAnalysis: prospect.websiteAnalysis ?? null,
      })),
    });
  } catch {
    // Non-critical — don't fail the sync for a result save error
  }
}
