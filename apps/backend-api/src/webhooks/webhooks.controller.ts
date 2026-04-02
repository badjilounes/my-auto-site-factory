import { Controller, Post, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  handleStripe(
    @Body() payload: Record<string, any>,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.webhooksService.handleStripeWebhook(payload, signature);
  }

  @Post('vercel')
  @ApiOperation({ summary: 'Handle Vercel deploy webhook events' })
  handleVercel(@Body() payload: Record<string, any>) {
    return this.webhooksService.handleVercelWebhook(payload);
  }
}
