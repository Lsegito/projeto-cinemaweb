import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FilmeNovoEvent } from '../kafka/kafka.constants';

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Chamado pelo consumidor Kafka ao receber um evento de filme novo. */
  async criarDeFilmeNovo(evento: FilmeNovoEvent) {
    const generoTexto = evento.genero ? ` (${evento.genero})` : '';
    const notificacao = await this.prisma.notificacao.create({
      data: {
        tipo: 'FILME_NOVO',
        titulo: 'Novo filme em cartaz! 🎬',
        mensagem: `"${evento.titulo}"${generoTexto} acabou de chegar ao CineWeb. Confira as sessões!`,
        filmeId: evento.filmeId,
      },
    });
    this.logger.log(`Notificação criada: ${notificacao.id}`);
    return notificacao;
  }

  /**
   * Lista as notificações mais recentes.
   * Se `desde` for informado, retorna apenas as criadas depois dessa data
   * (usado pelo mobile para buscar só as novidades).
   */
  async findAll(desde?: string) {
    const data = desde ? new Date(desde) : undefined;
    return this.prisma.notificacao.findMany({
      where: data && !isNaN(data.getTime()) ? { criadoEm: { gt: data } } : undefined,
      orderBy: { criadoEm: 'desc' },
      take: 20,
    });
  }
}
