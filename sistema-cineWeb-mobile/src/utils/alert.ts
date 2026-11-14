import { Alert, AlertButton, Platform } from 'react-native';

/**
 * Alert multiplataforma.
 * No Android/iOS usa o Alert nativo. No navegador (Expo Web) o Alert do
 * React Native não exibe nada, então usamos window.alert / window.confirm.
 */
export function showAlert(titulo: string, mensagem?: string, botoes?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(titulo, mensagem, botoes);
    return;
  }

  const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;
  const acoes = (botoes ?? []).filter((b) => b.style !== 'cancel');

  if (!botoes || botoes.length <= 1) {
    window.alert(texto);
    acoes[0]?.onPress?.();
    return;
  }

  // Dois botões (ex.: "Depois" / "Ver filmes"): OK = ação principal
  const principal = acoes[acoes.length - 1];
  if (window.confirm(`${texto}\n\n[OK] ${principal?.text ?? 'Confirmar'}`)) {
    principal?.onPress?.();
  }
}

export default showAlert;
