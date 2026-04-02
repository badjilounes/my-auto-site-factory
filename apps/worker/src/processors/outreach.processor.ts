import { Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { Resend } from 'resend';

const prisma = new PrismaClient();

interface OutreachJobData {
  prospectId: string;
}

export async function processOutreachJob(
  job: Job<OutreachJobData>
): Promise<void> {
  const { prospectId } = job.data;

  // Fetch prospect with generated site data
  const prospect = await prisma.prospect.findUniqueOrThrow({
    where: { id: prospectId },
    include: { generatedSite: true },
  });

  if (!prospect.email) {
    throw new Error(
      `Prospect "${prospect.businessName}" (${prospectId}) has no email address`
    );
  }

  if (!prospect.generatedSite || prospect.generatedSite.deploymentStatus !== 'DEPLOYED') {
    throw new Error(
      `Prospect "${prospect.businessName}" (${prospectId}) does not have a deployed site`
    );
  }

  const sitePreviewUrl = prospect.generatedSite.vercelUrl;

  try {
    await job.updateProgress(10);

    // ─── Step 1: Create ClientAccount with Clerk ──────────────────────
    // TODO: Integrate Clerk user creation via @clerk/backend SDK
    // For now, we prepare the client account data. In production this would
    // call clerkClient.users.createUser({ emailAddress: [prospect.email], ... })
    // and store the returned clerkUserId on the ClientAccount record.

    let clientAccount = await prisma.clientAccount.findUnique({
      where: { prospectId },
    });

    if (!clientAccount) {
      clientAccount = await prisma.clientAccount.create({
        data: {
          prospectId,
          email: prospect.email,
          // clerkUserId will be set once Clerk integration is active
          clerkUserId: null,
          isActive: true,
          subscriptionStatus: 'TRIAL',
        },
      });
    }

    console.log(
      `[outreach] ClientAccount created/found for "${prospect.businessName}" (${clientAccount.id})`
    );

    await job.updateProgress(30);

    // ─── Step 2: Create Stripe customer + invoice ─────────────────────

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-02-24.acacia',
    });

    // Create Stripe customer
    const customer = await stripe.customers.create({
      email: prospect.email,
      name: prospect.businessName,
      metadata: {
        prospectId,
        clientAccountId: clientAccount.id,
      },
    });

    console.log(
      `[outreach] Stripe customer created: ${customer.id} for "${prospect.businessName}"`
    );

    // Create an invoice for the initial setup / first month
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: 'send_invoice',
      days_until_due: 14,
      metadata: {
        prospectId,
        clientAccountId: clientAccount.id,
      },
    });

    // Add a line item to the invoice
    await stripe.invoiceItems.create({
      customer: customer.id,
      invoice: invoice.id!,
      amount: 4900, // 49.00 EUR
      currency: 'eur',
      description: `Website creation and hosting - ${prospect.businessName}`,
    });

    // Finalize the invoice so it's ready to send
    const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id!);

    // Create Invoice record in DB
    await prisma.invoice.create({
      data: {
        clientAccountId: clientAccount.id,
        stripeInvoiceId: finalizedInvoice.id,
        amount: 49.0,
        currency: 'EUR',
        status: 'SENT',
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    await job.updateProgress(60);

    // ─── Step 3: Send personalized outreach email via Resend ──────────

    const resend = new Resend(process.env.RESEND_API_KEY!);

    const subject = `${prospect.businessName} - Votre nouveau site web est pret !`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #334155; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { text-align: center; margin-bottom: 32px; }
    .header h1 { font-size: 24px; color: #1e293b; margin: 0; }
    .preview-box { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 24px 0; }
    .preview-img { background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 48px 24px; text-align: center; }
    .preview-img h2 { margin: 0 0 8px; font-size: 20px; }
    .preview-img p { margin: 0; opacity: 0.9; }
    .cta { display: inline-block; background: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0; }
    .cta:hover { background: #2563eb; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 13px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bonjour ${prospect.businessName},</h1>
    </div>
    <p>
      Nous avons cree un site web professionnel pour <strong>${prospect.businessName}</strong>
      et nous aimerions vous le montrer !
    </p>
    <div class="preview-box">
      <div class="preview-img">
        <h2>${prospect.businessName}</h2>
        <p>${prospect.cuisine ?? 'Restaurant'} - ${prospect.city ?? ''}</p>
      </div>
    </div>
    <p style="text-align: center;">
      <a href="${sitePreviewUrl}" class="cta">Voir votre site web</a>
    </p>
    <p>
      Ce site a ete concu sur mesure pour mettre en valeur votre etablissement.
      Il est deja en ligne et pret a attirer de nouveaux clients.
    </p>
    <p>
      Si vous souhaitez l'adopter, nous vous proposons un hebergement et une
      maintenance a partir de <strong>49 EUR/mois</strong>.
    </p>
    <p>
      N'hesitez pas a repondre directement a cet email si vous avez des questions.
    </p>
    <p>Cordialement,<br>L'equipe My Auto Site Factory</p>
    <div class="footer">
      <p>Cet email vous a ete envoye car votre restaurant est reference sur les plateformes de livraison.</p>
    </div>
  </div>
</body>
</html>`.trim();

    const fromAddress = process.env.OUTREACH_FROM_EMAIL ?? 'hello@myautositefactory.com';

    const emailResult = await resend.emails.send({
      from: fromAddress,
      to: [prospect.email],
      subject,
      html: htmlBody,
    });

    console.log(
      `[outreach] Email sent to ${prospect.email} for "${prospect.businessName}" (resend id: ${emailResult.data?.id})`
    );

    await job.updateProgress(85);

    // ─── Step 4: Update prospect status to OUTREACH_SENT ──────────────

    await prisma.prospect.update({
      where: { id: prospectId },
      data: { status: 'OUTREACH_SENT' },
    });

    // ─── Step 5: Create OutreachEmail record ──────────────────────────

    await prisma.outreachEmail.create({
      data: {
        prospectId,
        subject,
        body: htmlBody,
        status: 'SENT',
        sentAt: new Date(),
      },
    });

    await job.updateProgress(100);

    console.log(
      `[outreach] Outreach complete for "${prospect.businessName}" (${prospectId})`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    console.error(
      `[outreach] Failed outreach for "${prospect.businessName}" (${prospectId}): ${errorMessage}`
    );

    throw error;
  }
}
