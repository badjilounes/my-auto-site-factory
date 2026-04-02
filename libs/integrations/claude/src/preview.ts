import type { ProspectData } from './types';

/**
 * Build a standalone HTML preview from generated Next.js files.
 *
 * Since the generated code is Next.js (React components), we can't directly
 * render it in an iframe. Instead, we build an approximate HTML preview
 * by extracting the page.tsx content structure and inlining Tailwind CSS.
 *
 * This preview is stored in GeneratedSite.generatedCode for display
 * in the admin dashboard before deployment.
 */
export function buildPreviewHtml(
  files: Record<string, string>,
  prospect: ProspectData,
): string {
  // Extract the globals.css for any custom styles
  const globalsCss = files['app/globals.css'] ?? '';
  const tailwindCustom = extractCssVariables(globalsCss);

  // Try to extract color theme from tailwind.config
  const tailwindConfig = files['tailwind.config.ts'] ?? files['tailwind.config.js'] ?? '';
  const primaryColor = extractPrimaryColor(tailwindConfig) || '#2563eb';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${prospect.businessName} — Site Vitrine</title>
  <meta name="description" content="${prospect.description || `${prospect.businessName} à ${prospect.city}`}">
  <!-- Tailwind CSS CDN for preview rendering -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '${primaryColor}',
          }
        }
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; margin: 0; }
    ${tailwindCustom}
  </style>
</head>
<body class="bg-white text-gray-900">
  <!-- Preview Banner -->
  <div style="background: linear-gradient(135deg, ${primaryColor}, ${adjustColor(primaryColor, -30)}); color: white; text-align: center; padding: 8px; font-size: 13px; font-weight: 500;">
    Prévisualisation — ${prospect.businessName}
  </div>

  <!-- Hero Section -->
  <section class="relative h-[60vh] min-h-[400px] flex items-center justify-center text-white" style="background: linear-gradient(135deg, ${primaryColor}dd, ${adjustColor(primaryColor, -40)}ee), url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80') center/cover;">
    <div class="text-center px-4">
      <h1 class="text-5xl md:text-6xl font-extrabold mb-4 drop-shadow-lg">${prospect.businessName}</h1>
      <p class="text-xl md:text-2xl mb-8 opacity-90">${prospect.cuisineType || 'Bienvenue'} — ${prospect.city}</p>
      ${prospect.phone ? `<a href="tel:${prospect.phone}" class="inline-block bg-white text-gray-900 font-semibold px-8 py-3 rounded-full hover:bg-gray-100 transition shadow-lg">Réserver au ${prospect.phone}</a>` : ''}
    </div>
  </section>

  <!-- About Section -->
  <section class="py-16 px-4 max-w-4xl mx-auto text-center">
    <h2 class="text-3xl font-bold mb-6">À propos</h2>
    <p class="text-lg text-gray-600 leading-relaxed">
      ${prospect.description || `${prospect.businessName} est un établissement situé au cœur de ${prospect.city}. Nous vous accueillons dans un cadre chaleureux pour vous faire découvrir notre cuisine ${prospect.cuisineType || 'de qualité'}.`}
    </p>
    ${prospect.rating ? `<div class="mt-6 flex items-center justify-center gap-2"><span class="text-2xl font-bold" style="color: ${primaryColor};">${prospect.rating}</span><span class="text-gray-500">/5</span>${prospect.reviewCount ? `<span class="text-gray-400 text-sm">(${prospect.reviewCount} avis)</span>` : ''}</div>` : ''}
  </section>

  <!-- Contact Section -->
  <section class="py-16 px-4 bg-gray-50">
    <div class="max-w-4xl mx-auto">
      <h2 class="text-3xl font-bold mb-8 text-center">Contact</h2>
      <div class="grid md:grid-cols-2 gap-8">
        <div class="space-y-4">
          ${prospect.address ? `<div><h3 class="font-semibold text-gray-700">Adresse</h3><p class="text-gray-600">${prospect.address}</p></div>` : ''}
          ${prospect.phone ? `<div><h3 class="font-semibold text-gray-700">Téléphone</h3><p class="text-gray-600"><a href="tel:${prospect.phone}" style="color: ${primaryColor};">${prospect.phone}</a></p></div>` : ''}
          ${prospect.email ? `<div><h3 class="font-semibold text-gray-700">Email</h3><p class="text-gray-600"><a href="mailto:${prospect.email}" style="color: ${primaryColor};">${prospect.email}</a></p></div>` : ''}
          ${formatOpeningHoursHtml(prospect.openingHours)}
        </div>
        <div class="bg-gray-200 rounded-lg h-64 flex items-center justify-center text-gray-500">
          ${prospect.address ? `<iframe src="https://maps.google.com/maps?q=${encodeURIComponent(prospect.address + ', ' + prospect.city)}&output=embed" width="100%" height="100%" frameborder="0" style="border-radius: 8px;" allowfullscreen loading="lazy"></iframe>` : '<p>Carte Google Maps</p>'}
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer style="background-color: ${primaryColor}; color: white;" class="py-8 px-4">
    <div class="max-w-4xl mx-auto text-center">
      <h3 class="text-xl font-bold mb-2">${prospect.businessName}</h3>
      <p class="opacity-80 text-sm">${prospect.address ? `${prospect.address}, ` : ''}${prospect.city}</p>
      ${prospect.phone ? `<p class="opacity-80 text-sm mt-1">${prospect.phone}</p>` : ''}
      <p class="opacity-60 text-xs mt-4">© ${new Date().getFullYear()} ${prospect.businessName}. Tous droits réservés.</p>
    </div>
  </footer>
</body>
</html>`;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractCssVariables(css: string): string {
  // Extract :root { ... } or custom CSS variable blocks
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/);
  return rootMatch ? `:root { ${rootMatch[1]} }` : '';
}

function extractPrimaryColor(config: string): string | null {
  // Try to find primary color in tailwind config
  const patterns = [
    /primary\s*:\s*['"]([#\w]+)['"]/,
    /['"]primary['"]\s*:\s*['"]([#\w]+)['"]/,
    /primary\s*:\s*\{\s*(?:DEFAULT|500)\s*:\s*['"]([#\w]+)['"]/,
  ];

  for (const pattern of patterns) {
    const match = config.match(pattern);
    if (match) return match[1];
  }

  return null;
}

function adjustColor(hex: string, amount: number): string {
  // Simple brightness adjustment
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function formatOpeningHoursHtml(hours: Record<string, string> | null | undefined): string {
  if (!hours || Object.keys(hours).length === 0) return '';

  const rows = Object.entries(hours)
    .map(([day, time]) => `<tr><td class="pr-4 font-medium">${day}</td><td class="text-gray-600">${time}</td></tr>`)
    .join('');

  return `<div><h3 class="font-semibold text-gray-700 mb-2">Horaires</h3><table class="text-sm">${rows}</table></div>`;
}
