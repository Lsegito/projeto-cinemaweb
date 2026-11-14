import { Global, Module } from '@nestjs/common';
import { KafkaProducerService } from './kafka-producer.service';

/**
 * Módulo global de mensageria.
 * Qualquer módulo pode injetar o KafkaProducerService para publicar eventos.
 */
@Global()
@Module({
  providers: [KafkaProducerService],
  exports: [KafkaProducerService],
})
export class KafkaModule {}
