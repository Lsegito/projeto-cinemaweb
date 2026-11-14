/**
 * Configurações centrais da mensageria (Apache Kafka).
 */
export const KAFKA_CLIENT_ID = 'cineweb-backend';

/** Grupo de consumidores responsável por gerar as notificações. */
export const KAFKA_NOTIFICACOES_GROUP_ID = 'cineweb-notificacoes';

/** Tópico onde é publicado um evento sempre que um filme novo é cadastrado. */
export const TOPICO_FILMES_NOVOS = 'filmes.novos';

/** Lista de brokers (ex.: "kafka:9092" dentro do Docker ou "localhost:9094" fora dele). */
export const getKafkaBrokers = (): string[] =>
  (process.env.KAFKA_BROKERS ?? 'localhost:9094')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);

/** Payload do evento publicado no tópico `filmes.novos`. */
export interface FilmeNovoEvent {
  filmeId: string;
  titulo: string;
  genero?: string;
  classificacaoEtaria: string;
  dataInicioExibicao: string;
  criadoEm: string;
}
