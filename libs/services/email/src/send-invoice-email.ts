import { getEmailClient } from './client';

export interface InvoiceData {
  number: string;
  amount: number;
  currency: string;
  dueDate: string;
  pdfUrl: string;
}

export async function sendInvoiceEmail(
  to: string,
  invoiceData: InvoiceData,
): Promise<{ id: string }> {
  const client = getEmailClient();
  const { number, amount, currency, dueDate, pdfUrl } = invoiceData;

  const formattedAmount = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(amount / 100);

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
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Nouvelle facture</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #1e293b; font-size: 16px; line-height: 1.6;">
                Bonjour,
              </p>
              <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.7;">
                Une nouvelle facture est disponible pour votre compte.
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Facture n&deg;</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 8px;">${number}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Montant</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; padding-bottom: 8px;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-size: 14px;">Date d'&eacute;ch&eacute;ance</td>
                        <td style="color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${dueDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${pdfUrl}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 14px 36px; border-radius: 8px;">
                      T&eacute;l&eacute;charger la facture
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.6; text-align: center;">
                Cet email a &eacute;t&eacute; envoy&eacute; par My Auto Site Factory.
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
    subject: `Facture ${number} - ${formattedAmount}`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send invoice email: ${error.message}`);
  }

  return { id: data!.id };
}
