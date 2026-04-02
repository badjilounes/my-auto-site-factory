/**
 * Template files injected into every generated site repository.
 * These ensure the repo is immediately deployable on Vercel.
 */

export const GITIGNORE = `# dependencies
node_modules/
.pnp
.pnp.js

# testing
coverage/

# next.js
.next/
out/

# production
build/
dist/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;

export function generateReadme(businessName: string, city: string): string {
  return `# ${businessName}

Site vitrine professionnel pour **${businessName}** — ${city}.

Généré automatiquement par [MonSiteVitrine](https://monsitevitrine.fr).

## Démarrage

\`\`\`bash
npm install
npm run dev
\`\`\`

Ouvrir [http://localhost:3000](http://localhost:3000).

## Stack technique

- [Next.js 15](https://nextjs.org/) — Framework React
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [TypeScript](https://www.typescriptlang.org/) — Typage statique

## Déploiement

Ce site est déployé automatiquement sur [Vercel](https://vercel.com).

---

© ${new Date().getFullYear()} ${businessName}. Tous droits réservés.
`;
}

export const VERCEL_JSON = `{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
`;

/** Files that should always exist in the repo, keyed by path */
export function getTemplateFiles(businessName: string, city: string): Record<string, string> {
  return {
    '.gitignore': GITIGNORE,
    'README.md': generateReadme(businessName, city),
    'vercel.json': VERCEL_JSON,
  };
}
