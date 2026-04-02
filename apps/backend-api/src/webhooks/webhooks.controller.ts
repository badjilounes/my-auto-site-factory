import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../auth';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly service: WebhooksService) {}

  @Post('stripe')
  @Public()
  @ApiOperation({ summary: 'Webhook Stripe (signature vérifiée)' })
  async handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Raw body not available — ensure rawBody: true in NestFactory');
    }
    return this.service.handleStripeWebhook(rawBody, signature);
  }

  @Post('vercel')
  @Public()
  @ApiOperation({ summary: 'Webhook Vercel (déploiement)' })
  async handleVercel(@Body() payload: Record<string, unknown>) {
    return this.service.handleVercelWebhook(payload);
  }

  @Post('resend')
  @Public()
  @ApiOperation({ summary: 'Webhook Resend (tracking emails)' })
  async handleResend(@Body() payload: Record<string, unknown>) {
    return this.service.handleResendWebhook(payload);
  }
}
