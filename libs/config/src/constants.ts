export const PRICING = {
  monthly: 29.99,
  yearly: 299.99,
  setup: 0,
} as const;

export const TRIAL_DAYS = 14;

export const SUPPORTED_CITIES = [
  'Paris',
  'Lyon',
  'Marseille',
  'Bordeaux',
  'Toulouse',
  'Nice',
  'Nantes',
  'Strasbourg',
  'Montpellier',
  'Lille',
] as const;

export const MAX_SCRAPING_RESULTS = 100;

export const SITE_TEMPLATES = ['restaurant', 'cafe', 'bakery'] as const;
