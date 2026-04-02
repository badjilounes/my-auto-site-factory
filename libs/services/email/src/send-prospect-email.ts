import { getEmailClient } from './client';
import { getProspectOutreachHtml } from './templates/prospect-outreach';

export async function sendProspectEmail(
  to: string,
  prospectName: string,
  siteUrl: string,
  portalUrl: string,
): Promise<{ id: string }> {
  const client = getEmailClient();
  const html = getProspectOutreachHtml({ prospectName, siteUrl, portalUrl });

  const { data, error } = await client.emails.send({
    from: process.env.EMAIL_FROM || 'My Auto Site Factory <noreply@myautositefactory.com>',
    to,
    subject: `${prospectName}, votre site web est en ligne !`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send prospect email: ${error.message}`);
  }

  return { id: data!.id };
}
