/**
 * Configuration for the prospect-finder worker.
 *
 * Cities and categories can be set via:
 * 1. Environment variables (SCRAPING_CITIES, SCRAPING_CATEGORIES)
 * 2. Defaults from @my-auto-site-factory/config constants
 *
 * Env format: comma-separated values
 *   SCRAPING_CITIES=Paris,Lyon,Marseille
 *   SCRAPING_CATEGORIES=pizza,sushi,burger
 */

import { SUPPORTED_CITIES } from '@my-auto-site-factory/config';

export interface ProspectFinderConfig {
  /** Cities to scrape */
  cities: string[];
  /** Cuisine categories to search for (empty = all) */
  categories: string[];
  /** Redis connection URL */
  redisUrl: string;
  /** Max results per source per city (default: 30) */
  maxResultsPerCity: number;
  /** Delay between city scrapes in ms (default: 5000) */
  delayBetweenCities: number;
  /** Whether to analyze websites found (default: true) */
  analyzeWebsites: boolean;
  /** Run as cron (standalone) or as BullMQ worker */
  mode: 'cron' | 'worker';
  /** Cron interval in minutes (only for cron mode, default: 0 = run once) */
  cronIntervalMinutes: number;
  /** Proxy URL for scrapers */
  proxyUrl?: string;
}

export function loadConfig(): ProspectFinderConfig {
  const cities = process.env['SCRAPING_CITIES']
    ? process.env['SCRAPING_CITIES'].split(',').map((c) => c.trim()).filter(Boolean)
    : [...SUPPORTED_CITIES];

  const categories = process.env['SCRAPING_CATEGORIES']
    ? process.env['SCRAPING_CATEGORIES'].split(',').map((c) => c.trim()).filter(Boolean)
    : [];

  const mode = process.env['PROSPECT_FINDER_MODE'] === 'cron' ? 'cron' : 'worker';

  return {
    cities,
    categories,
    redisUrl: process.env['REDIS_URL'] || 'redis://localhost:6379',
    maxResultsPerCity: parseInt(process.env['MAX_RESULTS_PER_CITY'] || '30', 10),
    delayBetweenCities: parseInt(process.env['DELAY_BETWEEN_CITIES'] || '5000', 10),
    analyzeWebsites: process.env['ANALYZE_WEBSITES'] !== 'false',
    mode,
    cronIntervalMinutes: parseInt(process.env['CRON_INTERVAL_MINUTES'] || '0', 10),
    proxyUrl: process.env['SCRAPER_PROXY_URL'] || undefined,
  };
}
