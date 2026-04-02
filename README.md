# My Auto Site Factory

Plateforme automatisee de creation et vente de sites vitrines pour restaurants et commerces.

## Architecture

```
my-auto-site-factory/
├── apps/
│   ├── admin-dashboard/     ← Next.js 15 - Dashboard admin interne
│   ├── client-portal/       ← Next.js 15 - Portail client (paiement, domaine)
│   ├── backend-api/         ← NestJS 11 - API REST centrale
│   ├── prospect-finder/     ← Node.js - Worker scraping + reconciliation
│   └── site-generator/      ← Node.js - Worker generation IA + deploy
├── libs/
│   ├── core/
│   │   ├── types/           ← Zod schemas + TypeScript types
│   │   └── database/        ← Prisma client + repositories
│   ├── integrations/
│   │   ├── scrapers/        ← UberEats, Deliveroo, website analyzer
│   │   ├── claude/          ← Anthropic SDK - generation de sites
│   │   ├── github/          ← Octokit - creation repos + push code
│   │   └── vercel/          ← Vercel API - deploy + domaines
│   ├── services/
│   │   ├── auth/            ← NextAuth v5 + JWT
│   │   ├── email/           ← Resend + templates HTML
│   │   └── payments/        ← Stripe (customers, subscriptions, invoices)
│   ├── shared/
│   │   └── ui/              ← Composants shadcn/ui + Tailwind
│   ├── features/
│   │   ├── prospect-management/
│   │   ├── site-generation/
│   │   └── client-billing/
│   ├── config/              ← Env validation + constantes
│   └── utils/               ← Helpers (format, validation, retry)
└── prisma/                  ← Schema Prisma
```

## Stack technique

| Categorie | Technologie |
|-----------|-------------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui |
| Backend API | NestJS 11, Swagger |
| Database | PostgreSQL + Prisma ORM |
| Queue | BullMQ + Redis |
| Auth | NextAuth v5 (JWT) |
| Paiements | Stripe (subscriptions, invoices) |
| Emails | Resend + templates HTML |
| IA | Anthropic Claude (generation de sites) |
| Deploiement | Vercel (sites generes) + GitHub API |
| Scraping | Playwright (UberEats, Deliveroo) |
| Monorepo | NX 22 |

## Demarrage rapide

### Prerequis
- Node.js 20+
- PostgreSQL
- Redis

### Installation

```bash
# Cloner et installer
git clone <repo-url>
cd my-auto-site-factory
npm install --legacy-peer-deps

# Configurer l'environnement
cp .env.example .env
# Remplir les variables dans .env

# Initialiser la base de donnees
npm run db:generate
npm run db:push
```

### Lancer les applications

```bash
# Dashboard admin (port 4100)
npm run dev:dashboard

# Portail client (port 4200)
npm run dev:portal

# API backend (port 3333)
npm run dev:api

# Worker - Prospect Finder (scraping)
npm run dev:prospect-finder

# Worker - Site Generator (IA + deploy)
npm run dev:site-generator
```

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL PostgreSQL |
| `REDIS_URL` | URL Redis |
| `ANTHROPIC_API_KEY` | Cle API Anthropic (Claude) |
| `GITHUB_TOKEN` | Token GitHub (creation repos) |
| `VERCEL_TOKEN` | Token Vercel (deploiement) |
| `VERCEL_TEAM_ID` | ID equipe Vercel (optionnel) |
| `STRIPE_SECRET_KEY` | Cle secrete Stripe |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe |
| `RESEND_API_KEY` | Cle API Resend (emails) |
| `FROM_EMAIL` | Email expediteur |
| `NEXTAUTH_SECRET` | Secret NextAuth |
| `NEXTAUTH_URL` | URL de base NextAuth |
| `DASHBOARD_URL` | URL du dashboard admin |
| `PORTAL_URL` | URL du portail client |
| `API_URL` | URL de l'API backend |

## Pipeline de fonctionnement

```
1. SCRAPING     → prospect-finder scrape UberEats/Deliveroo/Google
2. ENRICHMENT   → Reconciliation des donnees multi-sources
3. FICHE        → Prospect cree en DB, visible dans le dashboard
4. GENERATION   → Claude genere un site Next.js complet
5. DEPLOY       → Code pousse sur GitHub → deploye sur Vercel
6. DEMARCHAGE   → Email personnalise envoye au prospect
7. CONVERSION   → Prospect se connecte au portail, paie, lie son domaine
```

## Pricing

| Plan | Prix | Details |
|------|------|---------|
| Mensuel | 29,99 EUR/mois | Hebergement + domaine + support |
| Annuel | 299,99 EUR/an | 2 mois offerts |
| Essai gratuit | 14 jours | Acces complet |

## Commandes NX utiles

```bash
# Build tout
npm run build

# Linter
npm run lint

# Tests
npm run test

# Prisma Studio (visualiser la DB)
npm run db:studio

# Creer une migration
npm run db:migrate
```
