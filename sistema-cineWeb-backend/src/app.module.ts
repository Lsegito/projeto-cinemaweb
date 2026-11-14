import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FilmesModule } from './filmes/filmes.module';
import { SalasModule } from './salas/salas.module';
import { SessoesModule } from './sessoes/sessoes.module';
import { LancheCombosModule } from './lanche-combos/lanche-combos.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { IngressosModule } from './ingressos/ingressos.module';
import { GenerosModule } from './generos/generos.module';
import { KafkaModule } from './kafka/kafka.module';
import { NotificacoesModule } from './notificacoes/notificacoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    FilmesModule,
    SalasModule,
    SessoesModule,
    LancheCombosModule,
    PedidosModule,
    IngressosModule,
    GenerosModule,
    KafkaModule,
    NotificacoesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
