import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// ── Site Generation Queue ──────────────────────────────────────────────

interface SiteGenerationJobData {
  prospectId: string;
}

const siteGenerationWorker = new Worker<SiteGenerationJobData>(
  'site-generation',
  async (job) => {
    const { prospectId } = job.data;
    console.log(`[Site Generator] Starting site generation for prospect ${prospectId}`);

    const prospect = await prisma.prospect.findUniqueOrThrow({
      where: { id: prospectId },
    });

    try {
      // 1. Generate site code using Claude
      const { generateSiteCode } = await import('@my-auto-site-factory/integrations-claude');
      const siteCode = await generateSiteCode({
        businessName: prospect.businessName,
        cuisine: prospect.cuisine,
        city: prospect.city,
        logoUrl: prospect.logoUrl,
        rating: prospect.rating,
        priceRange: prospect.priceRange,
      });

      // 2. Create GitHub repository
      const { createRepository, pushCode } = await import('@my-auto-site-factory/integrations-github');
      const repoName = `site-${prospect.businessName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const repo = await createRepository(repoName, `Auto-generated site for ${prospect.businessName}`);

      // 3. Push generated code to repo
      await pushCode(repo.fullName, siteCode);

      // 4. Create Vercel project and trigger deployment
      const { createProject, triggerDeployment } = await import('@my-auto-site-factory/integrations-vercel');
      const vercelProject = await createProject(repoName, repo.fullName);
      const deployment = await triggerDeployment(vercelProject.id);

      // 5. Save GeneratedSite record
      await prisma.generatedSite.create({
        data: {
          prospectId: prospect.id,
          repoUrl: repo.htmlUrl,
          vercelProjectId: vercelProject.id,
          deploymentUrl: deployment.url,
          previewUrl: deployment.url,
          status: 'DEPLOYED',
        },
      });

      // 6. Update prospect status
      await prisma.prospect.update({
        where: { id: prospectId },
        data: { status: 'SITE_DEPLOYED' },
      });

      console.log(`[Site Generator] Site deployed for ${prospect.businessName}: ${deployment.url}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Site Generator] Failed for prospect ${prospectId}:`, errorMessage);

      await prisma.prospect.update({
        where: { id: prospectId },
        data: { status: 'GENERATION_FAILED' },
      });

      throw error;
    }
  },
  { connection, concurrency: 1 }
);

// ── Outreach Queue ─────────────────────────────────────────────────────

interface OutreachJobData {
  prospectId: string;
}

const outreachWorker = new Worker<OutreachJobData>(
  'outreach',
  async (job) => {
    const { prospectId } = job.data;
    console.log(`[Site Generator] Starting outreach for prospect ${prospectId}`);

    const prospect = await prisma.prospect.findUniqueOrThrow({
      where: { id: prospectId },
      include: { generatedSites: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    const generatedSite = prospect.generatedSites[0];
    if (!generatedSite) {
      throw new Error(`No generated site found for prospect ${prospectId}`);
    }

    try {
      // 1. Create Stripe customer and invoice
      const { createCustomer, createInvoice } = await import('@my-auto-site-factory/services-payments');
      const customer = await createCustomer({
        name: prospect.businessName,
        email: prospect.email || '',
      });
      const invoice = await createInvoice(customer.id, {
        description: `Website for ${prospect.businessName}`,
        amount: 4900, // $49.00
      });

      // 2. Send outreach email
      const { sendOutreachEmail } = await import('@my-auto-site-factory/services-email');
      const emailResult = await sendOutreachEmail({
        to: prospect.email || '',
        businessName: prospect.businessName,
        previewUrl: generatedSite.previewUrl || generatedSite.deploymentUrl,
        invoiceUrl: invoice.hostedUrl,
      });

      // 3. Create OutreachEmail record
      await prisma.outreachEmail.create({
        data: {
          prospectId: prospect.id,
          generatedSiteId: generatedSite.id,
          emailTo: prospect.email || '',
          subject: emailResult.subject,
          body: emailResult.body,
          stripeCustomerId: customer.id,
          stripeInvoiceId: invoice.id,
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      // 4. Update prospect status
      await prisma.prospect.update({
        where: { id: prospectId },
        data: { status: 'OUTREACH_SENT' },
      });

      console.log(`[Site Generator] Outreach sent to ${prospect.businessName} (${prospect.email})`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[Site Generator] Outreach failed for prospect ${prospectId}:`, errorMessage);
      throw error;
    }
  },
  { connection, concurrency: 2 }
);

// ── Event Handlers ─────────────────────────────────────────────────────

siteGenerationWorker.on('completed', (job) => {
  console.log(`[Site Generator] Site generation job ${job.id} completed`);
});

siteGenerationWorker.on('failed', (job, err) => {
  console.error(`[Site Generator] Site generation job ${job?.id} failed:`, err.message);
});

outreachWorker.on('completed', (job) => {
  console.log(`[Site Generator] Outreach job ${job.id} completed`);
});

outreachWorker.on('failed', (job, err) => {
  console.error(`[Site Generator] Outreach job ${job?.id} failed:`, err.message);
});

console.log('[Site Generator] Workers started, waiting for site-generation and outreach jobs...');
