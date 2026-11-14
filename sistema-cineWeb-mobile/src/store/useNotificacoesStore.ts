import { create } from 'zustand';
import { Notificacao } from '../@types';

interface NotificacoesState {
  /** Últimas notificações recebidas nesta execução do app */
  recebidas: Notificacao[];
  /** Incrementado a cada filme novo, para as telas recarregarem a lista */
  versaoFilmes: number;
  adicionar: (novas: Notificacao[]) => void;
}

export const useNotificacoesStore = create<NotificacoesState>((set) => ({
  recebidas: [],
  versaoFilmes: 0,
  adicionar: (novas) =>
    set((state) => ({
      recebidas: [...novas, ...state.recebidas].slice(0, 20),
      versaoFilmes: state.versaoFilmes + 1,
    })),
}));

export default useNotificacoesStore;
