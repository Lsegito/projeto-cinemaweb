import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Admin, Kafka, Producer, logLevel } from 'kafkajs';
import { KAFKA_CLIENT_ID, TOPICO_FILMES_NOVOS, getKafkaBrokers } from './kafka.constants';

/**
 * Produtor Kafka.
 * Publica eventos de domínio (ex.: "filme novo cadastrado") nos tópicos do Kafka.
 *
 * A conexão é feita em segundo plano: se o broker ainda não estiver de pé,
 * a API continua funcionando e o produtor tenta reconectar no próximo envio.
 */
@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly producer: Producer;
  private readonly admin: Admin;
  private connected = false;

  constructor() {
    const kafka = new Kafka({
      clientId: KAFKA_CLIENT_ID,
      brokers: getKafkaBrokers(),
      logLevel: logLevel.WARN,
      // Poucas tentativas: se o Kafka estiver fora, o cadastro do filme não fica travado
      retry: { initialRetryTime: 300, retries: 3 },
    });
    this.producer = kafka.producer({ allowAutoTopicCreation: true });
    this.admin = kafka.admin();
  }

  onModuleInit() {
    // Não bloqueia a inicialização da API caso o Kafka demore a subir
    void this.connect();
  }

  private async connect(): Promise<boolean> {
    if (this.connected) return true;
    try {
      await this.producer.connect();
      await this.garantirTopicos();
      this.connected = true;
      this.logger.log(`Produtor conectado ao Kafka (${getKafkaBrokers().join(', ')})`);
    } catch (error) {
      this.logger.warn(`Não foi possível conectar ao Kafka: ${(error as Error).message}`);
    }
    return this.connected;
  }

  /** Cria os tópicos usados pelo sistema, caso ainda não existam. */
  private async garantirTopicos() {
    await this.admin.connect();
    try {
      const existentes = await this.admin.listTopics();
      if (existentes.includes(TOPICO_FILMES_NOVOS)) return;

      const criado = await this.admin.createTopics({
        topics: [{ topic: TOPICO_FILMES_NOVOS, numPartitions: 1, replicationFactor: 1 }],
        waitForLeaders: true,
      });
      if (criado) this.logger.log(`Tópico "${TOPICO_FILMES_NOVOS}" criado`);
    } finally {
      await this.admin.disconnect();
    }
  }

  /**
   * Publica uma mensagem em um tópico.
   * Retorna `true` se a mensagem foi entregue ao broker.
   */
  async publish<T>(topic: string, key: string, payload: T): Promise<boolean> {
    if (!(await this.connect())) return false;
    try {
      await this.producer.send({
        topic,
        messages: [{ key, value: JSON.stringify(payload) }],
      });
      this.logger.log(`Evento publicado no tópico "${topic}" (key=${key})`);
      return true;
    } catch (error) {
      this.logger.error(`Falha ao publicar no tópico "${topic}": ${(error as Error).message}`);
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.connected) await this.producer.disconnect();
  }
}
