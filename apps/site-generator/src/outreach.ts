/**
 * Outreach pipeline: send a personalized email to a prospect
 * with their generated site, create a client account + Stripe invoice.
 *
 * Steps:
 * 1. Fetch prospect + generated site from DB
 * 2. Create Stripe customer + invoice
 * 3. Create client account in DB
 * 4. Send outreach email via Resend
 * 5. Save OutreachEmail record
 * 6. Update prospect status → OUTREACH_SENT
 */

import {
  prospectRepository,
  generatedSiteRepository,
  clientAccountRepository,
  outreachEmailRepository,
  invoiceRepository,
  prisma,
} from '@my-auto-site-factory/core-database';
import { createCustomer, createInvoice } from '@my-auto-site-factory/services-payments';
import { sendProspectEmail } from '@my-auto-site-factory/services-email';
import { PRICING, TRIAL_DAYS } from '@my-auto-site-factory/config';

export interface OutreachResult {
  prospectId: string;
  businessName: string;
  emailId: string;
  stripeCustomerId: string;
  clientAccountId: string;
}

export async function runOutreachPipeline(prospectId: string): Promise<OutreachResult> {
  console.log(`[Outreach] Starting outreach for prospect ${prospectId}`);

  // ── Step 1: Fetch prospect + site ─────────────────────────────────────

  const prospect = await prospectRepository.findById(prospectId);
  if (!prospect) throw new Error(`Prospect ${prospectId} introuvable`);

  const site = await generatedSiteRepository.findByProspectId(prospectId);
  if (!site || site.deploymentStatus !== 'DEPLOYED') {
    throw new Error(`Aucun site déployé pour le prospect ${prospectId}. Générez d'abord le site.`);
  }

  if (!prospect.email) {
    throw new Error(`Prospect ${prospectId} n'a pas d'email. Impossible d'envoyer l'outreach.`);
  }

  const portalUrl = process.env['PORTAL_URL'] || 'http://localhost:4200';
  const siteUrl = site.deploymentUrl || '';

  // ── Step 2: Create Stripe customer + invoice ──────────────────────────

  console.log(`[Outreach] Création du client Stripe pour ${prospect.businessName}...`);

  const stripeCustomer = await createCustomer(
    prospect.email,
    prospect.businessName,
    { prospectId, city: prospect.city },
  );

  const stripeInvoice = await createInvoice(stripeCustomer.id, [
    {
      description: `Site vitrine professionnel — ${prospect.businessName} (abonnement mensuel)`,
      amount: Math.round(PRICING.monthly * 100), // Stripe uses centimes
    },
  ]);

  console.log(`[Outreach] Facture Stripe créée: ${stripeInvoice.id}`);

  // ── Step 3: Create client account ─────────────────────────────────────

  let clientAccount = await clientAccountRepository.findByProspectId(prospectId);

  if (!clientAccount) {
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    clientAccount = await clientAccountRepository.create({
      prospect: { connect: { id: prospectId } },
      email: prospect.email,
      businessName: prospect.businessName,
      ownerName: prospect.ownerName,
      phone: prospect.phone,
      stripeCustomerId: stripeCustomer.id,
      subscriptionStatus: 'TRIAL',
      trialEndsAt,
    });

    console.log(`[Outreach] Compte client créé: ${clientAccount.id}`);
  }

  // Save invoice in our DB
  await invoiceRepository.create({
    clientAccount: { connect: { id: clientAccount.id } },
    stripeInvoiceId: stripeInvoice.id,
    amount: PRICING.monthly,
    currency: 'EUR',
    description: `Abonnement mensuel — ${prospect.businessName}`,
    dueDate: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
    status: 'SENT',
  });

  // ── Step 4: Send outreach email ───────────────────────────────────────

  console.log(`[Outreach] Envoi de l'email à ${prospect.email}...`);

  const emailResult = await sendProspectEmail(
    prospect.email,
    prospect.businessName,
    siteUrl,
    portalUrl,
  );

  console.log(`[Outreach] Email envoyé: ${emailResult.id}`);

  // ── Step 5: Save OutreachEmail record ─────────────────────────────────

  const outreachEmail = await outreachEmailRepository.create({
    prospect: { connect: { id: prospectId } },
    to: prospect.email,
    subject: `${prospect.businessName}, votre site web est en ligne !`,
    htmlBody: `Email envoyé via Resend (ID: ${emailResult.id})`,
    status: 'SENT',
    sentAt: new Date(),
    resendEmailId: emailResult.id,
  });

  // ── Step 6: Update prospect status ────────────────────────────────────

  await prospectRepository.updateStatus(prospectId, 'OUTREACH_SENT');

  console.log(`[Outreach] Pipeline terminé pour ${prospect.businessName}`);

  return {
    prospectId,
    businessName: prospect.businessName,
    emailId: outreachEmail.id,
    stripeCustomerId: stripeCustomer.id,
    clientAccountId: clientAccount.id,
  };
}
