import { Module } from '@nestjs/common';
import { NotificacoesController } from './notificacoes.controller';
import { NotificacoesService } from './notificacoes.service';
import { NotificacoesConsumer } from './notificacoes.consumer';

@Module({
  controllers: [NotificacoesController],
  providers: [NotificacoesService, NotificacoesConsumer],
})
export class NotificacoesModule {}
