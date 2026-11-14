import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificacoesService } from './notificacoes.service';

@ApiTags('Notificações')
@Controller('notificacoes')
export class NotificacoesController {
  constructor(private readonly notificacoesService: NotificacoesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista as notificações de novos filmes (geradas via Kafka)' })
  @ApiQuery({
    name: 'desde',
    required: false,
    description: 'Data ISO. Retorna somente notificações criadas após essa data.',
  })
  @ApiResponse({ status: 200, description: 'Lista de notificações.' })
  findAll(@Query('desde') desde?: string) {
    return this.notificacoesService.findAll(desde);
  }
}
