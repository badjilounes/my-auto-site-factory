import { getEmailClient } from './client';

export async function sendWelcomeEmail(
  to: string,
  name: string,
  loginUrl: string,
): Promise<{ id: string }> {
  const client = getEmailClient();

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 40px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Bienvenue !</h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.85); font-size: 16px;">
                Votre espace client est pr&ecirc;t
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 20px; color: #475569; font-size: 15px; line-height: 1.7;">
                Votre compte a &eacute;t&eacute; cr&eacute;&eacute; avec succ&egrave;s. Vous pouvez d&egrave;s maintenant
                acc&eacute;der &agrave; votre espace client pour g&eacute;rer votre site, consulter vos factures
                et personnaliser votre pr&eacute;sence en ligne.
              </p>
              <p style="margin: 0 0 28px; color: #475569; font-size: 15px; line-height: 1.7;">
                Voici ce que vous pouvez faire depuis votre tableau de bord :
              </p>
              <ul style="margin: 0 0 28px; padding-left: 20px; color: #475569; font-size: 15px; line-height: 2;">
                <li>Personnaliser le contenu de votre site</li>
                <li>Mettre &agrave; jour vos horaires et coordonn&eacute;es</li>
                <li>Consulter les statistiques de visite</li>
                <li>G&eacute;rer votre abonnement et vos factures</li>
              </ul>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 36px; border-radius: 8px;">
                      Acc&eacute;der &agrave; mon espace
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6; text-align: center;">
                Cet email a &eacute;t&eacute; envoy&eacute; par My Auto Site Factory.<br>
                Si vous avez des questions, r&eacute;pondez simplement &agrave; cet email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const { data, error } = await client.emails.send({
    from: process.env.EMAIL_FROM || 'My Auto Site Factory <noreply@myautositefactory.com>',
    to,
    subject: `Bienvenue ${name} ! Votre espace client est prêt`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }

  return { id: data!.id };
}
