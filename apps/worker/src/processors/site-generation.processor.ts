import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import {
  AnthropicIntegration,
  BusinessData,
} from '../../../../libs/integrations/src/anthropic/client';
import { GitHubIntegration } from '../../../../libs/integrations/src/github/client';
import { VercelIntegration } from '../../../../libs/integrations/src/vercel/client';

const prisma = new PrismaClient();

interface SiteGenerationJobData {
  prospectId: string;
}

export async function processSiteGenerationJob(
  job: Job<SiteGenerationJobData>
): Promise<void> {
  const { prospectId } = job.data;

  // Fetch prospect data from DB
  const prospect = await prisma.prospect.findUniqueOrThrow({
    where: { id: prospectId },
    include: { generatedSite: true },
  });

  // Update prospect status to SITE_GENERATING
  await prisma.prospect.update({
    where: { id: prospectId },
    data: { status: 'SITE_GENERATING' },
  });

  // Create or get the GeneratedSite record
  let generatedSite = prospect.generatedSite;
  if (!generatedSite) {
    generatedSite = await prisma.generatedSite.create({
      data: {
        prospectId,
        deploymentStatus: 'PENDING',
      },
    });
  } else {
    await prisma.generatedSite.update({
      where: { id: generatedSite.id },
      data: { deploymentStatus: 'PENDING' },
    });
  }

  try {
    await job.updateProgress(10);

    // ─── Step 1: Generate site code via Anthropic ───────────────────────

    const anthropic = new AnthropicIntegration(process.env.ANTHROPIC_API_KEY!);

    const businessData: BusinessData = {
      name: prospect.businessName,
      description: prospect.description ?? `${prospect.cuisine ?? 'Restaurant'} in ${prospect.city ?? 'France'}`,
      cuisine: prospect.cuisine ?? 'Restaurant',
      address: prospect.address ?? '',
      phone: prospect.phone ?? '',
      email: prospect.email ?? '',
      openingHours: prospect.openingHours
        ? JSON.stringify(prospect.openingHours)
        : 'Mon-Sun: 11:00-22:00',
      logoUrl: prospect.logoUrl ?? '',
    };

    console.log(`[site-gen] Generating site code for "${prospect.businessName}"...`);
    const generatedFiles = await anthropic.generateSiteCode(businessData);

    await job.updateProgress(40);

    // Store generated code as JSON
    await prisma.generatedSite.update({
      where: { id: generatedSite.id },
      data: {
        generatedCode: JSON.stringify(generatedFiles),
        deploymentStatus: 'BUILDING',
      },
    });

    // ─── Step 2: Create GitHub repository ───────────────────────────────

    const github = new GitHubIntegration(process.env.GITHUB_TOKEN!);

    const repoName = `site-${prospect.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')}-${prospect.id.slice(0, 8)}`;

    console.log(`[site-gen] Creating GitHub repo "${repoName}"...`);
    const repo = await github.createRepository(
      repoName,
      `Auto-generated website for ${prospect.businessName}`,
      false
    );

    await prisma.generatedSite.update({
      where: { id: generatedSite.id },
      data: {
        repositoryUrl: repo.htmlUrl,
        repositoryName: repoName,
      },
    });

    await job.updateProgress(60);

    // ─── Step 3: Push generated code to repo ────────────────────────────

    console.log(`[site-gen] Pushing ${generatedFiles.length} files to repo...`);
    await github.pushCode(repoName, generatedFiles);

    await job.updateProgress(75);

    // ─── Step 4: Create Vercel project linked to repo ───────────────────

    const vercel = new VercelIntegration(process.env.VERCEL_TOKEN!);

    console.log(`[site-gen] Creating Vercel project for "${repoName}"...`);
    const vercelProject = await vercel.createProject(
      repoName,
      repo.htmlUrl,
      process.env.VERCEL_TEAM_ID
    );

    await prisma.generatedSite.update({
      where: { id: generatedSite.id },
      data: { vercelProjectId: vercelProject.id },
    });

    await job.updateProgress(85);

    // ─── Step 5: Trigger deployment ─────────────────────────────────────

    console.log(`[site-gen] Triggering deployment...`);
    const deployment = await vercel.triggerDeployment(vercelProject.id);

    const vercelUrl = `https://${deployment.url}`;

    // Update GeneratedSite record with final URLs and status
    await prisma.generatedSite.update({
      where: { id: generatedSite.id },
      data: {
        vercelUrl,
        deploymentStatus: 'DEPLOYED',
      },
    });

    // Update prospect status
    await prisma.prospect.update({
      where: { id: prospectId },
      data: { status: 'SITE_DEPLOYED' },
    });

    await job.updateProgress(100);

    console.log(
      `[site-gen] Site generation complete for "${prospect.businessName}". URL: ${vercelUrl}`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Mark as failed
    await prisma.generatedSite.update({
      where: { id: generatedSite.id },
      data: { deploymentStatus: 'FAILED' },
    });

    await prisma.prospect.update({
      where: { id: prospectId },
      data: { status: 'ENRICHED' },
    });

    console.error(
      `[site-gen] Failed to generate site for "${prospect.businessName}": ${errorMessage}`
    );

    throw error;
  }
}
