export interface ProspectOutreachData {
  prospectName: string;
  siteUrl: string;
  portalUrl: string;
}

export function getProspectOutreachHtml(data: ProspectOutreachData): string {
  const { prospectName, siteUrl, portalUrl } = data;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre nouveau site est prêt</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f7fa; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 40px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                Votre site web est prêt !
              </h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.85); font-size: 16px;">
                Un site moderne, créé spécialement pour vous
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Bonjour <strong>${prospectName}</strong>,
              </p>

              <p style="margin: 0 0 20px; color: #475569; font-size: 15px; line-height: 1.7;">
                Nous avons créé un site web moderne et professionnel pour votre établissement,
                <strong>entièrement gratuitement</strong>. Il est déjà en ligne et prêt à attirer
                de nouveaux clients.
              </p>

              <!-- Site Preview Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                    <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                      Votre site en ligne
                    </p>
                    <a href="${siteUrl}" style="color: #6366f1; font-size: 16px; font-weight: 600; text-decoration: none; word-break: break-all;">
                      ${siteUrl}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 28px; color: #475569; font-size: 15px; line-height: 1.7;">
                Pour personnaliser votre site, gérer vos informations et accéder à votre tableau
                de bord, cliquez sur le bouton ci-dessous. Profitez d'un <strong>essai gratuit
                de 14 jours</strong>, sans engagement.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${portalUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 36px; border-radius: 8px; letter-spacing: 0.3px;">
                      Accéder à mon espace
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 28px 0 0; color: #94a3b8; font-size: 13px; line-height: 1.6; text-align: center;">
                Essai gratuit de 14 jours &middot; Aucune carte bancaire requise &middot; Annulation libre
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6; text-align: center;">
                Cet email a été envoyé par My Auto Site Factory.<br>
                Si vous ne souhaitez plus recevoir nos emails,
                <a href="#" style="color: #94a3b8; text-decoration: underline;">cliquez ici</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
