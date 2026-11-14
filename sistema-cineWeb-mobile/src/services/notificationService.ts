import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import { Notificacao } from '../@types';

const ULTIMA_NOTIFICACAO_KEY = 'cineweb_ultima_notificacao';

/**
 * Serviço de notificações de novos filmes.
 *
 * Fluxo da mensageria:
 *   Admin cadastra filme → Backend publica no tópico Kafka "filmes.novos"
 *   → Consumidor Kafka grava a notificação → este serviço busca em GET /notificacoes.
 */
export const notificationService = {
  /** Busca notificações criadas depois de `desde` (ISO). Sem `desde`, traz as mais recentes. */
  async getNotificacoes(desde?: string): Promise<Notificacao[]> {
    const response = await api.get<Notificacao[]>('/notificacoes', {
      params: desde ? { desde } : undefined,
    });
    return response.data;
  },

  async getUltimaVista(): Promise<string | null> {
    return AsyncStorage.getItem(ULTIMA_NOTIFICACAO_KEY);
  },

  async setUltimaVista(dataIso: string): Promise<void> {
    await AsyncStorage.setItem(ULTIMA_NOTIFICACAO_KEY, dataIso);
  },

  /**
   * Retorna somente as notificações que o usuário ainda não viu
   * e atualiza o marcador local. Na primeira execução apenas marca
   * o ponto de partida (não exibe notificações antigas).
   */
  async buscarNovas(): Promise<Notificacao[]> {
    const ultimaVista = await this.getUltimaVista();

    if (!ultimaVista) {
      const recentes = await this.getNotificacoes();
      await this.setUltimaVista(recentes[0]?.criadoEm ?? new Date().toISOString());
      return [];
    }

    const novas = await this.getNotificacoes(ultimaVista);
    if (novas.length > 0) {
      // A API retorna em ordem decrescente: a primeira é a mais recente
      await this.setUltimaVista(novas[0].criadoEm);
    }
    return novas;
  },
};

export default notificationService;
