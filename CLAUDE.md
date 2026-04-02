# CLAUDE.md — My Auto Site Factory

## Projet

Plateforme SaaS automatisée de création et vente de sites vitrines pour restaurants/commerces.
Pipeline : Scraping → Enrichissement → Génération IA → Déploiement → Démarchage → Conversion client.

## Architecture

Monorepo NX 22 avec 5 apps et 15 libs. Stack : TypeScript strict, Next.js 15, NestJS 11, Prisma/PostgreSQL, BullMQ/Redis, Stripe, Resend, Anthropic Claude, Vercel API.

```
apps/
  admin-dashboard/     → Next.js 15 (port 4100) — dashboard admin interne
  client-portal/       → Next.js 15 (port 4200) — portail client (paiement, domaine)
  backend-api/         → NestJS 11 (port 3333) — API REST centrale
  prospect-finder/     → Node.js BullMQ worker — scraping + réconciliation
  site-generator/      → Node.js BullMQ worker — génération IA + deploy

libs/
  core/types/          → Zod schemas + types TS (source de vérité)
  core/database/       → Prisma client + 8 repositories
  integrations/scrapers/ → Playwright (UberEats, Deliveroo, website analyzer)
  integrations/claude/   → Anthropic SDK — génération de code Next.js
  integrations/github/   → Octokit — création repos + push
  integrations/vercel/   → Vercel REST API — deploy + domaines
  services/auth/         → NextAuth v5 + JWT + rôles (ADMIN, CLIENT)
  services/email/        → Resend + templates HTML (outreach, invoice, welcome)
  services/payments/     → Stripe (customers, subscriptions, invoices, webhooks)
  shared/ui/             → shadcn/ui + Tailwind (13 composants)
  features/prospect-management/ → hooks + composants React
  features/site-generation/     → hooks + composants React
  features/client-billing/      → hooks + composants React
  config/                → Env Zod + constantes/pricing
  utils/                 → Format, validation, retry
```

## Commandes

```bash
npm run dev:dashboard        # Next.js admin (4100)
npm run dev:portal           # Next.js client (4200)
npm run dev:api              # NestJS API (3333)
npm run dev:prospect-finder  # Worker scraping
npm run dev:site-generator   # Worker IA + deploy
npm run db:generate          # Prisma generate
npm run db:migrate           # Prisma migrate dev
npm run db:push              # Prisma db push
npm run db:studio            # Prisma Studio
npm run build                # nx run-many --target=build --all
npm run lint                 # nx run-many --target=lint --all
npm run test                 # nx run-many --target=test --all
```

## Conventions de code

- TypeScript strict partout, pas de `any` sauf `Prisma.*Input` types
- Imports via path aliases `@my-auto-site-factory/*` (définis dans tsconfig.base.json)
- Validation Zod à l'entrée (API) avec les schemas de `libs/core/types`
- Prisma comme seul ORM, accès via repositories dans `libs/core/database`
- Composants React : `'use client'` directive quand hooks/state, Tailwind CSS, pas de CSS modules
- Enums identiques entre Zod (core/types) et Prisma (schema.prisma) — les garder synchronisés
- Noms de fichiers : kebab-case. Exports nommés, pas de default exports
- Français pour le contenu utilisateur (emails, labels UI), anglais pour le code
- Pas de console.log en production — utiliser le logger NestJS ou un wrapper

## Base de données

PostgreSQL + Prisma. Schema dans `prisma/schema.prisma`.
10 modèles : User, Account, Session, VerificationToken, Prospect, GeneratedSite, ClientAccount, Invoice, ScrapingJob, ScrapingResult, OutreachEmail.
9 enums : ProspectStatus, DeploymentStatus, SubscriptionStatus, SubscriptionPlan, InvoiceStatus, ScrapingSource, ScrapingJobStatus, OutreachEmailStatus, UserRole.
Migration initiale dans `prisma/migrations/0001_init/`.

## Variables d'environnement

Voir `.env.example`. Validation Zod dans `libs/config/src/env.ts`.
Variables critiques : DATABASE_URL, REDIS_URL, ANTHROPIC_API_KEY, GITHUB_TOKEN, VERCEL_TOKEN, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, NEXTAUTH_SECRET, NEXTAUTH_URL.

## Pricing

- Mensuel : 29,99 €/mois
- Annuel : 299,99 €/an (2 mois offerts)
- Essai gratuit : 14 jours, sans CB
- Constantes dans `libs/config/src/constants.ts`

---

# Agents et tâches pour finaliser le SaaS

## Agent 1 — Migration Clerk → NextAuth (CRITIQUE)

```
Les apps admin-dashboard et client-portal utilisent encore @clerk/nextjs.
Migre vers NextAuth v5 en utilisant la config de libs/services/auth/.

Pour admin-dashboard :
1. Remplace ClerkProvider par SessionProvider de next-auth/react dans layout.tsx
2. Crée apps/admin-dashboard/src/app/api/auth/[...nextauth]/route.ts qui expose les handlers de libs/services/auth
3. Crée un middleware.ts à la racine de apps/admin-dashboard/ qui protège toutes les routes sauf /sign-in
4. Remplace les imports @clerk/nextjs (SignIn, SignUp, UserButton, useUser) par les équivalents next-auth (signIn, signOut, useSession)
5. Mets à jour les pages sign-in et crée une page sign-in custom si nécessaire
6. Le rôle ADMIN doit être vérifié — seuls les admins accèdent au dashboard

Pour client-portal :
1. Même migration SessionProvider
2. Route API auth [...nextauth]
3. middleware.ts protégeant toutes les routes sauf /, /sign-in, /sign-up
4. Le rôle CLIENT suffit pour le portail
5. Les pages billing, domain, site doivent rediriger si non connecté

Retire @clerk/nextjs et @clerk/backend du package.json racine.
Vérifie que les tsconfig path aliases @my-auto-site-factory/services-auth sont utilisés.
```

## Agent 2 — Sécurisation NestJS API (CRITIQUE)

```
L'API backend-api n'a aucune sécurité. Ajoute :

1. Guards JWT :
   - Crée apps/backend-api/src/guards/jwt-auth.guard.ts qui vérifie le token JWT NextAuth
   - Crée apps/backend-api/src/guards/roles.guard.ts avec un décorateur @Roles('ADMIN', 'CLIENT')
   - Applique JwtAuthGuard globalement sauf sur /webhooks/*

2. DTOs avec class-validator :
   - Crée des DTOs pour chaque controller en utilisant les Zod schemas de @my-auto-site-factory/core-types
   - Utilise zod-dto ou crée un pipe custom Zod → ValidationPipe
   - Prospect : CreateProspectDto, UpdateProspectDto, ProspectFilterDto
   - Invoice : CreateInvoiceDto, UpdateInvoiceDto
   - Scraping : StartScrapingDto
   - Client : CreateClientDto

3. Sécurité :
   - Ajoute helmet dans main.ts
   - Ajoute rate-limiting avec @nestjs/throttler (100 req/min global, 10/min sur /auth)
   - Valide les signatures Stripe dans webhooks.controller.ts (utilise libs/services/payments/src/webhooks.ts)
   - Ajoute un GlobalExceptionFilter qui log les erreurs et retourne des ApiError standardisés

4. CORS : Configure les origines autorisées (DASHBOARD_URL, PORTAL_URL)
```

## Agent 3 — Webhook Resend + Tracking emails (HAUTE PRIORITÉ)

```
Le schema OutreachEmail supporte les statuts OPENED/CLICKED/BOUNCED mais aucun webhook ne les gère.

1. Ajoute un endpoint POST /webhooks/resend dans apps/backend-api/src/webhooks/
2. Vérifie la signature du webhook Resend (header svix-signature)
3. Gère les événements : email.delivered, email.opened, email.clicked, email.bounced, email.failed
4. Met à jour le OutreachEmail correspondant via resendEmailId
5. Utilise outreachEmailRepository.markSent/markOpened/markClicked
6. Ajoute un endpoint GET /outreach-emails/stats qui retourne les taux d'ouverture/clic par campagne
```

## Agent 4 — Tests unitaires et d'intégration (CRITIQUE)

```
Zéro test dans le projet. Configure et écris les tests :

1. Configuration :
   - Ajoute vitest comme test runner (plus rapide que jest avec ESM)
   - Configure dans chaque app/lib un vitest.config.ts
   - Ajoute une target "test" dans nx.json

2. Tests unitaires libs/ :
   - core/types : valider que les Zod schemas acceptent/rejettent correctement
   - core/database : mocker PrismaClient, tester chaque repository
   - services/payments : mocker Stripe, tester createCustomer, handleWebhook
   - services/email : mocker Resend, tester sendProspectEmail
   - integrations/scrapers : tester reconcileBusinessData avec des données mock
   - utils : tester format, validation, retry

3. Tests d'intégration API :
   - Utilise @nestjs/testing + supertest
   - Teste les endpoints prospects CRUD avec une DB de test (sqlite ou mock)
   - Teste les webhooks Stripe/Vercel avec des payloads simulés
   - Teste les guards (accès refusé sans token, accès OK avec token ADMIN)

4. Couverture minimum : 70% sur les libs, 50% sur les apps
```

## Agent 5 — Docker + Seed + CI/CD (HAUTE PRIORITÉ)

```
Aucune containerisation ni seed.

1. Docker :
   - Crée un Dockerfile multi-stage pour backend-api (build NX → image Node.js alpine)
   - Crée un Dockerfile pour prospect-finder et site-generator
   - Crée docker-compose.yml avec : postgres, redis, backend-api, prospect-finder, site-generator
   - Les apps Next.js seront déployées sur Vercel (pas besoin de Docker)

2. Seed script :
   - Crée prisma/seed.ts avec :
     - 1 user admin (admin@monsitevitrine.fr)
     - 1 user client
     - 10 prospects variés (différents statuts, villes, cuisines)
     - 2 GeneratedSite (DEPLOYED)
     - 1 ClientAccount avec 2 invoices
     - 2 ScrapingJob (COMPLETED)
   - Configure "prisma.seed" dans package.json

3. CI/CD (.github/workflows/) :
   - ci.yml : lint + typecheck + test + build sur chaque PR
   - deploy-api.yml : build Docker → push sur registry → deploy sur Railway/Fly.io
   - deploy-frontend.yml : trigger Vercel deployment pour dashboard et portal
   - Ajoute les étapes prisma migrate deploy dans le pipeline API
```

## Agent 6 — Intégration libs ↔ apps (HAUTE PRIORITÉ)

```
Les apps n'importent pas les libs via les path aliases. Corrige ça :

1. admin-dashboard :
   - Importe les composants de @my-auto-site-factory/shared-ui (Button, Card, Badge, Table, StatusBadge, StatsCard)
   - Importe les hooks de @my-auto-site-factory/prospect-management (useProspects, useProspect, useGenerateSite, useSendOutreach)
   - Importe les composants de @my-auto-site-factory/site-generation (SitePreview, GenerationStatus)
   - Importe les types de @my-auto-site-factory/core-types pour typer les données
   - Remplace les fetch() inline par les hooks des feature libs

2. client-portal :
   - Importe de @my-auto-site-factory/shared-ui
   - Importe de @my-auto-site-factory/client-billing (BillingDashboard, InvoiceList, DomainSetup)
   - Importe de @my-auto-site-factory/site-generation (SitePreview)

3. backend-api :
   - Importe les repositories de @my-auto-site-factory/core-database au lieu de PrismaClient direct
   - Importe les types de @my-auto-site-factory/core-types pour la validation
   - Importe getConfig() de @my-auto-site-factory/config pour les variables d'env

4. Workers (prospect-finder, site-generator) :
   - Importent les clients de @my-auto-site-factory/integrations-* au lieu d'imports directs
   - Importent les repositories de @my-auto-site-factory/core-database
```

## Agent 7 — Monitoring, Logging, Analytics (MOYENNE PRIORITÉ)

```
Ajoute l'observabilité :

1. Logging structuré :
   - Crée libs/utils/src/logger.ts avec un wrapper pino ou winston
   - Format JSON en production, pretty en dev
   - Injecte dans NestJS via un LoggerModule custom
   - Ajoute des logs sur chaque étape du pipeline (scraping start/end, generation, deploy, email sent)

2. Health checks :
   - Ajoute un endpoint GET /health dans backend-api qui vérifie : DB, Redis, et retourne le statut
   - Ajoute dans docker-compose healthcheck pour chaque service

3. Métriques dashboard :
   - Ajoute un endpoint GET /analytics/dashboard qui retourne :
     - Nombre de prospects par statut
     - Nombre de sites déployés
     - Taux de conversion (OUTREACH_SENT → CLIENT)
     - Revenus mensuels (somme invoices PAID du mois)
     - Taux d'ouverture emails
   - Utilise les fonctions countByStatus, findOverdue etc. des repositories

4. Error tracking :
   - Ajoute Sentry (optionnel) avec @sentry/nestjs et @sentry/nextjs
   - Capture les erreurs non gérées dans les workers
```

## Agent 8 — Templates de sites générés (MOYENNE PRIORITÉ)

```
Le site-generator utilise Claude pour générer du code mais n'a pas de templates de base.

1. Crée libs/integrations/claude/src/templates/ avec des prompts optimisés :
   - restaurant.ts : prompt pour restaurant (hero avec photo, menu, horaires, carte Google Maps, avis, réservation)
   - cafe.ts : prompt pour café/boulangerie (ambiance, carte boissons/pâtisseries)
   - generic.ts : prompt générique commerce de proximité

2. Chaque template retourne un prompt system + user pour Claude qui génère :
   - Un projet Next.js complet (app router)
   - pages : accueil, menu/carte, à propos, contact
   - Composants : Hero, MenuSection, ContactForm, Footer, GoogleMap
   - Tailwind CSS avec un thème dérivé du logo/couleurs du prospect
   - Données pré-remplies depuis les infos du prospect (nom, adresse, horaires, téléphone)
   - SEO : meta tags, Open Graph, schema.org LocalBusiness

3. Mets à jour libs/integrations/claude/src/client.ts pour accepter un template name et utiliser le bon prompt

4. Ajoute un système de preview : avant de deployer, stocker le HTML généré dans GeneratedSite.generatedCode pour preview dans le dashboard
```
