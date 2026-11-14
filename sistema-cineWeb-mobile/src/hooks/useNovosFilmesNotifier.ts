import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import notificationService from '../services/notificationService';
import { navigationRef } from '../navigation/navigationRef';
import { Notificacao } from '../@types';
import { showAlert } from '../utils/alert';

const INTERVALO_MS = 15000; // consulta a cada 15 segundos

/**
 * Verifica periodicamente se há notificações de novos filmes
 * (geradas pelo consumidor Kafka no backend) e exibe um alerta.
 * A verificação pausa com o app em segundo plano e roda de novo ao voltar.
 */
export function useNovosFilmesNotifier(onNovosFilmes?: (notificacoes: Notificacao[]) => void) {
  const callbackRef = useRef(onNovosFilmes);
  callbackRef.current = onNovosFilmes;

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let verificando = false;

    const verificar = async () => {
      if (verificando) return;
      verificando = true;
      try {
        const novas = await notificationService.buscarNovas();
        if (novas.length === 0) return;

        callbackRef.current?.(novas);

        const titulo = novas.length === 1 ? novas[0].titulo : `${novas.length} novos filmes em cartaz! 🎬`;
        const mensagem = novas.map((n) => n.mensagem).join('\n\n');

        showAlert(titulo, mensagem, [
          { text: 'Depois', style: 'cancel' },
          {
            text: 'Ver filmes',
            onPress: () => {
              if (navigationRef.isReady()) {
                navigationRef.navigate('Main', { screen: 'Filmes' });
              }
            },
          },
        ]);
      } catch (error) {
        // Sem conexão: tenta novamente no próximo ciclo
        console.warn('[Notificações] Falha ao verificar novos filmes:', (error as Error).message);
      } finally {
        verificando = false;
      }
    };

    const iniciar = () => {
      if (timer) return;
      void verificar();
      timer = setInterval(verificar, INTERVALO_MS);
    };

    const parar = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };

    iniciar();
    const sub = AppState.addEventListener('change', (estado: AppStateStatus) => {
      if (estado === 'active') iniciar();
      else parar();
    });

    return () => {
      parar();
      sub.remove();
    };
  }, []);
}

export default useNovosFilmesNotifier;
