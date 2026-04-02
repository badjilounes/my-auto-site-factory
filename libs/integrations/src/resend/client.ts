import { Resend } from 'resend';

export interface InvoiceEmailData {
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  items: { description: string; amount: string }[];
  paymentUrl: string;
}

export interface EmailResult {
  id: string;
}

export class ResendIntegration {
  private resend: Resend;
  private fromAddress: string;

  constructor(apiKey: string, fromAddress = 'noreply@autositefactory.com') {
    this.resend = new Resend(apiKey);
    this.fromAddress = fromAddress;
  }

  async sendProspectEmail(
    to: string,
    prospectName: string,
    siteUrl: string,
    portalUrl: string
  ): Promise<EmailResult> {
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; margin-top: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #eee; }
    .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
    .content { padding: 30px 0; }
    .cta-button { display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
    .cta-button.secondary { background-color: #64748b; }
    .cta-section { text-align: center; padding: 20px 0; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your New Website is Ready!</h1>
    </div>
    <div class="content">
      <p>Hi ${prospectName},</p>
      <p>We've built a modern, professional website specifically for your business. We believe a strong online presence is key to attracting new customers and growing your brand.</p>
      <p>Here's what we've prepared for you:</p>
      <ul>
        <li>A fully responsive, mobile-friendly design</li>
        <li>Professional layout with your business information</li>
        <li>SEO-optimized pages to help customers find you</li>
        <li>Fast loading speeds for the best user experience</li>
      </ul>
      <div class="cta-section">
        <a href="${siteUrl}" class="cta-button">Preview Your Website</a>
        <a href="${portalUrl}" class="cta-button secondary">Client Portal</a>
      </div>
      <p>If you'd like to customize anything or have questions, simply reply to this email or visit your client portal.</p>
      <p>Best regards,<br>The Auto Site Factory Team</p>
    </div>
    <div class="footer">
      <p>Auto Site Factory - Professional websites for local businesses</p>
    </div>
  </div>
</body>
</html>`;

      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: `${prospectName} - Your new professional website is ready!`,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { id: data?.id ?? '' };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to send prospect email to "${to}": ${message}`
      );
    }
  }

  async sendInvoiceEmail(
    to: string,
    invoiceData: InvoiceEmailData
  ): Promise<EmailResult> {
    try {
      const itemsHtml = invoiceData.items
        .map(
          (item) =>
            `<tr><td style="padding: 10px; border-bottom: 1px solid #eee;">${item.description}</td><td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.amount}</td></tr>`
        )
        .join('');

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; margin-top: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #eee; }
    .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
    .content { padding: 30px 0; }
    .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .invoice-table th { background-color: #f8fafc; padding: 10px; text-align: left; border-bottom: 2px solid #e2e8f0; }
    .invoice-table th:last-child { text-align: right; }
    .total-row { font-weight: 700; font-size: 18px; }
    .cta-button { display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .cta-section { text-align: center; padding: 20px 0; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice #${invoiceData.invoiceNumber}</h1>
    </div>
    <div class="content">
      <p>Please find your invoice details below:</p>
      <p><strong>Due Date:</strong> ${invoiceData.dueDate}</p>
      <table class="invoice-table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td style="padding: 10px;">Total</td>
            <td style="padding: 10px; text-align: right;">${invoiceData.amount}</td>
          </tr>
        </tbody>
      </table>
      <div class="cta-section">
        <a href="${invoiceData.paymentUrl}" class="cta-button">Pay Invoice</a>
      </div>
    </div>
    <div class="footer">
      <p>Auto Site Factory - Professional websites for local businesses</p>
    </div>
  </div>
</body>
</html>`;

      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: `Invoice #${invoiceData.invoiceNumber} - ${invoiceData.amount} due ${invoiceData.dueDate}`,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { id: data?.id ?? '' };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to send invoice email to "${to}": ${message}`
      );
    }
  }

  async sendWelcomeEmail(
    to: string,
    name: string,
    loginUrl: string
  ): Promise<EmailResult> {
    try {
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; border-radius: 8px; margin-top: 20px; }
    .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #eee; }
    .header h1 { color: #2563eb; margin: 0; font-size: 24px; }
    .content { padding: 30px 0; }
    .feature-list { list-style: none; padding: 0; }
    .feature-list li { padding: 8px 0; padding-left: 24px; position: relative; }
    .feature-list li::before { content: "\\2713"; position: absolute; left: 0; color: #22c55e; font-weight: bold; }
    .cta-button { display: inline-block; padding: 14px 28px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }
    .cta-section { text-align: center; padding: 20px 0; }
    .footer { text-align: center; padding: 20px 0; border-top: 1px solid #eee; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Auto Site Factory!</h1>
    </div>
    <div class="content">
      <p>Hi ${name},</p>
      <p>Welcome aboard! Your account has been set up and your website is live. Here's what you can do from your client portal:</p>
      <ul class="feature-list">
        <li>View and manage your website</li>
        <li>Update your business information</li>
        <li>View analytics and visitor stats</li>
        <li>Manage your subscription and billing</li>
        <li>Request changes and customizations</li>
      </ul>
      <div class="cta-section">
        <a href="${loginUrl}" class="cta-button">Access Your Portal</a>
      </div>
      <p>If you have any questions, don't hesitate to reach out. We're here to help your business grow!</p>
      <p>Best regards,<br>The Auto Site Factory Team</p>
    </div>
    <div class="footer">
      <p>Auto Site Factory - Professional websites for local businesses</p>
    </div>
  </div>
</body>
</html>`;

      const { data, error } = await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: `Welcome to Auto Site Factory, ${name}!`,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      return { id: data?.id ?? '' };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(
        `Failed to send welcome email to "${to}": ${message}`
      );
    }
  }
}

export function createResendClient(
  apiKey: string,
  fromAddress?: string
): ResendIntegration {
  return new ResendIntegration(apiKey, fromAddress);
}
