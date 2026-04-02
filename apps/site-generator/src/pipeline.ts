/**
 * Site generation pipeline: Claude → GitHub → Vercel → DB update
 *
 * Orchestrates the full flow:
 * 1. Fetch prospect data from DB
 * 2. Generate site code with Claude (returns Next.js files)
 * 3. Create GitHub repo and push code
 * 4. Create Vercel project linked to repo
 * 5. Wait for deployment to be READY
 * 6. Save GeneratedSite record + update Prospect status
 *
 * Each step is idempotent and updates progress.
 */

import {
  prospectRepository,
  generatedSiteRepository,
  prisma,
} from '@my-auto-site-factory/core-database';
import { generateVitrineSite } from '@my-auto-site-factory/integrations-claude';
import { createRepoFromCode } from '@my-auto-site-factory/integrations-github';
import {
  createProject,
  deploy,
  waitForDeployment,
} from '@my-auto-site-factory/integrations-vercel';

export interface PipelineResult {
  prospectId: string;
  businessName: string;
  generatedSiteId: string;
  repositoryUrl: string;
  deploymentUrl: string;
  template: string;
  tokensUsed: number;
  durationMs: number;
}

export interface PipelineProgress {
  step: 'fetch' | 'generate' | 'github' | 'vercel' | 'deploy-wait' | 'save' | 'done' | 'error';
  message: string;
  percent: number;
}

type ProgressCallback = (progress: PipelineProgress) => void;

/**
 * Run the full site generation pipeline for a prospect.
 */
export async function runSiteGenerationPipeline(
  prospectId: string,
  onProgress?: ProgressCallback,
): Promise<PipelineResult> {
  const startTime = Date.now();

  const emit = (step: PipelineProgress['step'], message: string, percent: number) => {
    console.log(`[Pipeline] [${percent}%] ${message}`);
    onProgress?.({ step, message, percent });
  };

  // ── Step 1: Fetch prospect ────────────────────────────────────────────

  emit('fetch', 'Récupération des données du prospect...', 5);

  const prospect = await prospectRepository.findById(prospectId);
  if (!prospect) {
    throw new Error(`Prospect ${prospectId} introuvable`);
  }

  // Check if a site already exists (idempotent)
  const existingSite = await generatedSiteRepository.findByProspectId(prospectId);
  if (existingSite?.deploymentStatus === 'DEPLOYED') {
    emit('done', `Site déjà déployé: ${existingSite.deploymentUrl}`, 100);
    return {
      prospectId,
      businessName: prospect.businessName,
      generatedSiteId: existingSite.id,
      repositoryUrl: existingSite.githubRepoUrl || '',
      deploymentUrl: existingSite.deploymentUrl || '',
      template: existingSite.template,
      tokensUsed: 0,
      durationMs: Date.now() - startTime,
    };
  }

  const githubOwner = process.env['GITHUB_OWNER'] || '';

  try {
    // ── Step 2: Generate site code with Claude ────────────────────────────

    emit('generate', `Génération du site pour "${prospect.businessName}" avec Claude...`, 15);

    const generation = await generateVitrineSite(
      {
        businessName: prospect.businessName,
        ownerName: prospect.ownerName,
        email: prospect.email,
        phone: prospect.phone,
        address: prospect.address,
        city: prospect.city,
        postalCode: prospect.postalCode,
        website: prospect.website,
        description: prospect.description,
        cuisineType: prospect.cuisineType,
        openingHours: prospect.openingHours as Record<string, string> | null,
        rating: prospect.rating,
        reviewCount: prospect.reviewCount,
        priceRange: prospect.priceRange,
        logoUrl: prospect.logoUrl,
      },
      {
        onProgress: (e) => {
          if (e.type === 'generating') {
            emit('generate', e.message, 30);
          }
        },
      },
    );

    const fileCount = Object.keys(generation.files).length;
    emit('generate', `${fileCount} fichiers générés (${generation.tokensUsed} tokens, template: ${generation.template})`, 45);

    // ── Step 3: Create GitHub repo and push code ──────────────────────────

    const repoName = buildRepoName(prospect.businessName, prospect.city);
    emit('github', `Création du repo GitHub "${repoName}"...`, 55);

    const repo = await createRepoFromCode(githubOwner, repoName, generation.files, {
      description: `Site vitrine — ${prospect.businessName} (${prospect.city})`,
      businessName: prospect.businessName,
      city: prospect.city,
      isPrivate: false,
    });

    emit('github', `Code poussé sur ${repo.fullName}`, 65);

    // ── Step 4: Create Vercel project ────────────────────────────────────

    emit('vercel', `Création du projet Vercel...`, 70);

    const vercelProject = await createProject(repo.fullName);

    emit('vercel', `Déploiement en cours...`, 75);

    const deployment = await deploy(vercelProject.id);

    // ── Step 5: Wait for deployment ──────────────────────────────────────

    emit('deploy-wait', `Attente du déploiement (${deployment.url})...`, 80);

    const finalDeployment = await waitForDeployment(deployment.deploymentId, 300_000, 5_000);

    if (finalDeployment.state !== 'READY') {
      throw new Error(`Déploiement échoué: état=${finalDeployment.state}`);
    }

    const productionUrl = finalDeployment.productionUrl || finalDeployment.url;

    emit('save', `Déployé: ${productionUrl}`, 90);

    // ── Step 6: Save to DB ──────────────────────────────────────────────

    // Upsert GeneratedSite
    const subdomain = repoName;
    let generatedSite;

    if (existingSite) {
      generatedSite = await generatedSiteRepository.update(existingSite.id, {
        template: generation.template,
        repositoryName: repo.name,
        githubRepoUrl: repo.htmlUrl,
        vercelProjectId: vercelProject.id,
        vercelDeploymentId: deployment.deploymentId,
        deploymentUrl: productionUrl,
        deploymentStatus: 'DEPLOYED',
        generatedCode: generation.previewHtml,
        lastDeployedAt: new Date(),
      });
    } else {
      generatedSite = await prisma.generatedSite.create({
        data: {
          prospectId,
          template: generation.template,
          subdomain,
          repositoryName: repo.name,
          githubRepoUrl: repo.htmlUrl,
          vercelProjectId: vercelProject.id,
          vercelDeploymentId: deployment.deploymentId,
          deploymentUrl: productionUrl,
          deploymentStatus: 'DEPLOYED',
          generatedCode: generation.previewHtml,
          lastDeployedAt: new Date(),
        },
      });
    }

    // Update prospect status
    await prospectRepository.updateStatus(prospectId, 'SITE_DEPLOYED');

    const durationMs = Date.now() - startTime;

    emit('done', `Pipeline terminé en ${Math.round(durationMs / 1000)}s — ${productionUrl}`, 100);

    return {
      prospectId,
      businessName: prospect.businessName,
      generatedSiteId: generatedSite.id,
      repositoryUrl: repo.htmlUrl,
      deploymentUrl: productionUrl,
      template: generation.template,
      tokensUsed: generation.tokensUsed,
      durationMs,
    };
  } catch (error) {
    // Mark prospect as failed
    await prospectRepository.updateStatus(prospectId, 'SITE_GENERATED').catch(() => {});

    // If we created a GeneratedSite entry, mark it as FAILED
    if (existingSite) {
      await generatedSiteRepository.updateDeploymentStatus(existingSite.id, 'FAILED').catch(() => {});
    }

    const msg = error instanceof Error ? error.message : String(error);
    emit('error', `Échec: ${msg}`, 0);
    throw error;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a clean, unique repo name from business name + city.
 * e.g., "Pizza Napoli" + "Paris" → "site-pizza-napoli-paris"
 */
function buildRepoName(businessName: string, city: string): string {
  const slug = `site-${businessName}-${city}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-z0-9]+/g, '-')    // non-alphanum → dash
    .replace(/(^-|-$)/g, '')         // trim dashes
    .slice(0, 80);                   // GitHub limit ~100 chars

  return slug;
}
