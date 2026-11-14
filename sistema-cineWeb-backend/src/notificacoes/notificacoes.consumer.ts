import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, Kafka, logLevel } from 'kafkajs';
import {
  FilmeNovoEvent,
  KAFKA_CLIENT_ID,
  KAFKA_NOTIFICACOES_GROUP_ID,
  TOPICO_FILMES_NOVOS,
  getKafkaBrokers,
} from '../kafka/kafka.constants';
import { NotificacoesService } from './notificacoes.service';

/**
 * Consumidor Kafka do tópico `filmes.novos`.
 * Para cada filme novo publicado, gera uma notificação que os clientes
 * (Web e Mobile) passam a receber pela rota GET /notificacoes.
 */
@Injectable()
export class NotificacoesConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificacoesConsumer.name);
  private readonly consumer: Consumer;
  private running = false;

  constructor(private readonly notificacoesService: NotificacoesService) {
    const kafka = new Kafka({
      clientId: `${KAFKA_CLIENT_ID}-consumer`,
      brokers: getKafkaBrokers(),
      logLevel: logLevel.WARN,
      retry: { initialRetryTime: 2000, retries: 15 },
    });
    this.consumer = kafka.consumer({ groupId: KAFKA_NOTIFICACOES_GROUP_ID });
  }

  onModuleInit() {
    // Inicia em segundo plano para não travar a API se o Kafka ainda estiver subindo
    void this.start();
  }

  private async start(tentativa = 1): Promise<void> {
    try {
      await this.consumer.connect();
      // fromBeginning: na primeira execução do grupo lê todo o histórico do tópico;
      // depois disso o Kafka guarda o offset e só entrega mensagens novas.
      await this.consumer.subscribe({ topic: TOPICO_FILMES_NOVOS, fromBeginning: true });
      await this.consumer.run({
        eachMessage: async ({ message, partition }) => {
          if (!message.value) return;
          const evento = JSON.parse(message.value.toString()) as FilmeNovoEvent;
          this.logger.log(
            `Mensagem recebida de "${TOPICO_FILMES_NOVOS}" [partição ${partition}]: ${evento.titulo}`,
          );
          await this.notificacoesService.criarDeFilmeNovo(evento);
        },
      });
      this.running = true;
      this.logger.log(`Consumidor inscrito no tópico "${TOPICO_FILMES_NOVOS}"`);
    } catch (error) {
      const espera = Math.min(30, tentativa * 5);
      this.logger.warn(
        `Kafka indisponível (${(error as Error).message}). Nova tentativa em ${espera}s...`,
      );
      setTimeout(() => void this.start(tentativa + 1), espera * 1000);
    }
  }

  async onModuleDestroy() {
    if (this.running) await this.consumer.disconnect();
  }
}
