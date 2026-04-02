/**
 * Format a number as currency.
 */
export function formatCurrency(
  amount: number,
  currency = 'EUR',
  locale = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format a date to a human-readable string.
 */
export function formatDate(
  date: Date | string,
  locale = 'fr-FR',
  options?: Intl.DateTimeFormatOptions
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format a phone number to a standard display format.
 * Handles French phone numbers by default.
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  // French format: 06 12 34 56 78
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }

  // International French: +33 6 12 34 56 78
  if (cleaned.length === 11 && cleaned.startsWith('33')) {
    return `+${cleaned.replace(/(\d{2})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5 $6')}`;
  }

  // Return as-is if format is not recognized
  return phone;
}

/**
 * Convert a string to a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
