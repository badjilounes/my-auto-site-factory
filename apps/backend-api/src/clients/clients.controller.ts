import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientAccountCreateSchema } from '@my-auto-site-factory/core-types';
import { Roles, CurrentUser } from '../auth';
import { ZodValidationPipe } from '../common';
import { ClientsService } from './clients.service';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Lister tous les comptes clients' })
  findAll() {
    return this.service.findAll();
  }

  @Get('me')
  @ApiOperation({ summary: 'Mon compte client (utilisateur connecté)' })
  findMe(@CurrentUser('id') userId: string) {
    return this.service.findByUserId(userId);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Détail d\'un compte client' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a client account from a prospect' })
  create(
    @Body(new ZodValidationPipe(ClientAccountCreateSchema))
    body: {
      prospectId: string;
      email: string;
      businessName: string;
      ownerName?: string;
      phone?: string;
    },
  ) {
    return this.service.create(body);
  }
}
