import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';

@ApiTags('Invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all invoices' })
  findAll() {
    return this.invoicesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  create(
    @Body()
    data: {
      clientAccountId: string;
      amount: number;
      currency?: string;
      dueDate?: string;
    },
  ) {
    return this.invoicesService.create(data);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send an invoice' })
  send(@Param('id') id: string) {
    return this.invoicesService.send(id);
  }
}
