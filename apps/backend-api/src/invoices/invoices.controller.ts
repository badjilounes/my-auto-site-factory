import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InvoiceCreateSchema } from '@my-auto-site-factory/core-types';
import { Roles } from '../auth';
import { ZodValidationPipe } from '../common';
import { InvoicesService } from './invoices.service';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all invoices with pagination' })
  findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.invoicesService.findAll({
      status,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new invoice' })
  create(
    @Body(new ZodValidationPipe(InvoiceCreateSchema))
    data: Record<string, unknown>,
  ) {
    return this.invoicesService.create(data as any);
  }

  @Post(':id/send')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Send an invoice (DRAFT → SENT)' })
  send(@Param('id') id: string) {
    return this.invoicesService.send(id);
  }
}
