import type { ProspectData, SiteTemplate } from './types';

/**
 * Auto-detect the best template based on cuisineType.
 */
export function detectTemplate(prospect: ProspectData): SiteTemplate {
  const cuisine = (prospect.cuisineType ?? '').toLowerCase();

  if (/café|cafe|coffee|thé|tea/.test(cuisine)) return 'cafe';
  if (/boulangerie|bakery|pâtisserie|patisserie|viennoiserie/.test(cuisine)) return 'bakery';
  if (
    /restaurant|pizz|sushi|burger|bistro|brasserie|trattoria|grill|ramen|thaï|thai|indien|chinese|chinois|japonais|mexican|mexicain|libanais|kebab|couscous|tapas|gastronomique|crêperie|creperie/.test(
      cuisine,
    )
  )
    return 'restaurant';

  return 'generic';
}

/**
 * Build the system prompt that instructs Claude to generate a complete Next.js site.
 * This is the core of the generation quality.
 */
export function buildSystemPrompt(template: SiteTemplate): string {
  return `Tu es un développeur web senior expert en Next.js 15, Tailwind CSS et design UI/UX.
Tu génères des sites vitrines professionnels et modernes pour des commerces de proximité.

# MISSION
Génère un site vitrine COMPLET en Next.js 15 (App Router) + Tailwind CSS.
Le site doit être immédiatement déployable sur Vercel sans modification.

# CONTRAINTES TECHNIQUES ABSOLUES
- Next.js 15 avec App Router (dossier app/)
- Tailwind CSS 3.4+ pour tout le styling (PAS de CSS modules, PAS de styled-components)
- TypeScript strict
- Responsive design mobile-first (mobile, tablette, desktop)
- Images via next/image avec des placeholders Unsplash pertinents au commerce
- Polices Google via next/font/google (Inter pour le corps, une police display pour les titres)
- Pas de dépendances externes autres que celles dans le package.json généré
- Composants serveur par défaut, 'use client' uniquement quand nécessaire (formulaires, navigation mobile)
- Fichier layout.tsx avec les métadonnées SEO complètes
- Pas de base de données, pas d'API, site 100% statique

# FICHIERS À GÉNÉRER (TOUS obligatoires)
1. package.json — dépendances Next.js + Tailwind + types
2. next.config.js — config minimale avec images.remotePatterns pour unsplash
3. tsconfig.json — config TypeScript standard Next.js
4. tailwind.config.ts — thème personnalisé avec les couleurs du commerce
5. postcss.config.js — tailwind + autoprefixer
6. app/layout.tsx — layout racine avec metadata, police, fond
7. app/globals.css — @tailwind directives + variables CSS custom
8. app/page.tsx — page d'accueil complète avec TOUTES les sections
9. app/components/header.tsx — navigation sticky avec logo, liens, bouton CTA, menu hamburger mobile
10. app/components/hero.tsx — section héro plein écran avec image de fond, titre, sous-titre, CTA
11. app/components/about.tsx — section "À propos" avec description, photo, valeurs
12. app/components/menu.tsx — section menu/carte avec catégories et items (prix, description)
13. app/components/gallery.tsx — galerie photos (grille responsive)
14. app/components/testimonials.tsx — avis clients (données réalistes inventées)
15. app/components/contact.tsx — section contact avec adresse, téléphone, email, formulaire, carte (iframe Google Maps)
16. app/components/footer.tsx — footer avec liens, horaires, réseaux sociaux, copyright

${getTemplateSpecificInstructions(template)}

# FORMAT DE RÉPONSE
Retourne UNIQUEMENT un objet JSON valide (pas de markdown, pas de backticks, pas de texte avant/après) :
{
  "files": {
    "package.json": "contenu...",
    "next.config.js": "contenu...",
    "tsconfig.json": "contenu...",
    "tailwind.config.ts": "contenu...",
    "postcss.config.js": "contenu...",
    "app/layout.tsx": "contenu...",
    "app/globals.css": "contenu...",
    "app/page.tsx": "contenu...",
    "app/components/header.tsx": "contenu...",
    "app/components/hero.tsx": "contenu...",
    "app/components/about.tsx": "contenu...",
    "app/components/menu.tsx": "contenu...",
    "app/components/gallery.tsx": "contenu...",
    "app/components/testimonials.tsx": "contenu...",
    "app/components/contact.tsx": "contenu...",
    "app/components/footer.tsx": "contenu..."
  }
}

Chaque valeur est le contenu COMPLET du fichier, prêt à être écrit sur disque.
Le JSON doit être valide et parseable directement.`;
}

function getTemplateSpecificInstructions(template: SiteTemplate): string {
  switch (template) {
    case 'restaurant':
      return `# INSTRUCTIONS SPÉCIFIQUES — RESTAURANT
- Hero : photo de plat en fond (Unsplash food photography), overlay sombre, nom du restaurant en grand, tagline cuisine
- Menu : organisé par catégories (Entrées, Plats, Desserts, Boissons) avec prix en euros (€)
- Génère 12-15 items de menu RÉALISTES basés sur le type de cuisine
- Section "Réservation" avec bouton CTA (lien tel: pour le téléphone)
- Galerie : 6 photos de plats + ambiance intérieure (Unsplash)
- Témoignages : 3 avis réalistes avec note étoiles
- Palette de couleurs : tons chauds (ambre, orange foncé, crème) ou selon la cuisine
- Footer avec horaires d'ouverture formatés en tableau`;

    case 'cafe':
      return `# INSTRUCTIONS SPÉCIFIQUES — CAFÉ / SALON DE THÉ
- Hero : ambiance cozy, tasse de café fumante (Unsplash), tons chauds
- Menu : Boissons chaudes, Boissons froides, Pâtisseries, Snacks
- Génère 10-12 items avec descriptions évocatrices
- Section "Notre café" : provenance des grains, méthode de torréfaction
- Galerie : intérieur cozy, latte art, pâtisseries
- Palette : marron café, crème, vert sauge, touches dorées
- Ambiance : polices serif élégantes, espacement généreux`;

    case 'bakery':
      return `# INSTRUCTIONS SPÉCIFIQUES — BOULANGERIE / PÂTISSERIE
- Hero : pain artisanal, viennoiseries dorées (Unsplash), lumière chaude du matin
- Menu : Pains, Viennoiseries, Pâtisseries, Traiteur
- Génère 12+ items avec descriptions artisanales
- Section "Savoir-faire" : tradition, ingrédients, fabrication maison
- Galerie : atelier, fournée, vitrines
- Palette : doré, brun pain, blanc crème, touches de rouge brique
- Style : authentique, artisanal, chaleureux`;

    case 'generic':
      return `# INSTRUCTIONS SPÉCIFIQUES — COMMERCE DE PROXIMITÉ
- Hero : photo professionnelle en rapport avec l'activité (Unsplash)
- Au lieu d'un menu, affiche les Services / Produits phares
- Section "Nos valeurs" ou "Pourquoi nous choisir"
- Galerie : boutique, produits, équipe
- Palette : bleu professionnel, gris, touches de couleur vive
- Style : sobre, professionnel, inspirant confiance`;
  }
}

/**
 * Build the user prompt with all the prospect's data.
 */
export function buildUserPrompt(
  prospect: ProspectData,
  options?: { primaryColor?: string; extraInstructions?: string },
): string {
  const openingHoursStr = prospect.openingHours
    ? Object.entries(prospect.openingHours)
        .map(([day, hours]) => `${day}: ${hours}`)
        .join('\n')
    : 'Non renseigné';

  let prompt = `Génère le site vitrine pour ce commerce :

NOM : ${prospect.businessName}
${prospect.ownerName ? `PROPRIÉTAIRE : ${prospect.ownerName}` : ''}
TYPE / CUISINE : ${prospect.cuisineType || 'Commerce de proximité'}
ADRESSE : ${prospect.address || 'Non renseignée'}
VILLE : ${prospect.city}
${prospect.postalCode ? `CODE POSTAL : ${prospect.postalCode}` : ''}
TÉLÉPHONE : ${prospect.phone || 'Non renseigné'}
EMAIL : ${prospect.email || 'Non renseigné'}
SITE ACTUEL : ${prospect.website || 'Aucun'}
DESCRIPTION : ${prospect.description || `${prospect.businessName} est un établissement situé à ${prospect.city}.`}
NOTE : ${prospect.rating ? `${prospect.rating}/5 (${prospect.reviewCount || '?'} avis)` : 'Non noté'}
GAMME DE PRIX : ${prospect.priceRange || 'Non renseigné'}
${prospect.logoUrl ? `LOGO URL : ${prospect.logoUrl}` : ''}

HORAIRES D'OUVERTURE :
${openingHoursStr}`;

  if (options?.primaryColor) {
    prompt += `\n\nCOULEUR PRIMAIRE SOUHAITÉE : ${options.primaryColor}`;
  }

  if (options?.extraInstructions) {
    prompt += `\n\nINSTRUCTIONS SUPPLÉMENTAIRES :\n${options.extraInstructions}`;
  }

  prompt += `

IMPORTANT : Retourne UNIQUEMENT le JSON valide, rien d'autre. Pas de \`\`\`, pas de commentaires avant/après.
Tous les textes du site doivent être en FRANÇAIS.
Les données du commerce ci-dessus doivent être intégrées dans le site (adresse dans le footer, téléphone dans le contact, etc.).
Invente des contenus réalistes et professionnels pour les sections qui manquent de données (description, menu items, avis).`;

  return prompt;
}
