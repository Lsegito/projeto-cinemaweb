import { createNavigationContainerRef } from '@react-navigation/native';
import type { Sessao } from '../@types';

export type RootStackParamList = {
  Main: { screen?: 'Filmes' | 'Sessões' | 'Minha Conta' } | undefined;
  LoginStack: { screen?: string } | undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Checkout: { sessao: Sessao };
  TicketReceipt: { pedidoId: string | number };
};

/** Referência global de navegação (permite navegar fora de componentes de tela). */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();
