# Alterações realizadas

## 1. Mensageria com Apache Kafka (notificação de novos filmes)

**Infraestrutura**
- `docker-compose.yml`: novo serviço `kafka` (imagem oficial `apache/kafka:3.8.0`, modo KRaft, sem Zookeeper) com healthcheck. O backend só sobe depois que o Kafka está saudável e recebe `KAFKA_BROKERS=kafka:9092`.
- `.env.example` (raiz e backend): variável `KAFKA_BROKERS`.

**Backend (NestJS)**
- Dependência `kafkajs`.
- `src/kafka/kafka.constants.ts`: nome do tópico (`filmes.novos`), grupo de consumidores e formato do evento.
- `src/kafka/kafka-producer.service.ts`: **produtor**. Cria o tópico se ele não existir e publica as mensagens. Se o Kafka estiver fora, o cadastro do filme não trava: o envio desiste em ~2 s.
- `src/filmes/filmes.service.ts`: ao cadastrar um filme, publica o evento `FilmeNovoEvent` no tópico `filmes.novos`.
- `src/notificacoes/notificacoes.consumer.ts`: **consumidor** (grupo `cineweb-notificacoes`). Lê o tópico e grava uma `Notificacao` no banco. Se o Kafka ainda não estiver pronto, tenta reconectar.
- `src/notificacoes/notificacoes.controller.ts`: `GET /notificacoes?desde=<ISO>` (público, aparece no Swagger).
- Prisma: novo model `Notificacao` e a migration `20261114180000_add_notificacao`.

**Mobile (TypeScript)**
- `src/services/notificationService.ts`: busca as notificações e guarda localmente a última que já foi vista.
- `src/hooks/useNovosFilmesNotifier.ts`: consulta a cada 15 s (pausa com o app em segundo plano) e mostra o alerta **"Novo filme em cartaz! 🎬"**, com o botão "Ver filmes".
- `src/store/useNotificacoesStore.ts`: faz a tela de Filmes recarregar sozinha quando chega um filme novo.
- `src/navigation/navigationRef.ts`: tipagem das rotas (`RootStackParamList`) e uma referência de navegação global.

## 2. Correções

| Problema | Correção |
|---|---|
| `GET /pedidos` era público e expunha os pedidos de todos os clientes | Agora é restrito a **ADMIN**. Web e mobile passaram a usar rotas que devolvem só as poltronas ocupadas: `GET /sessoes/ocupacao` e `GET /sessoes/:id/assentos-ocupados` |
| A mesma poltrona podia ser vendida duas vezes | `PedidosService.create` valida dentro da transação se a poltrona já foi vendida na sessão ou se está repetida no próprio pedido |
| Arquivo `.js` no mobile (`src/@types/index.js`) | Removido. O mobile agora é 100% TypeScript |
| Comentários diziam "SecureStore", mas o código usa AsyncStorage | Comentários corrigidos e import sem uso removido |
| Tipos `any` no mobile (`Checkout: { sessao: any }`, seletores do store) | Tipados com `Sessao`, `RouteProp` e o estado do store |
| O build do frontend (`tsc -b`) falhava com a variável `idx` sem uso em `ComprovantePage.tsx` | Variável removida |
| Mobile: depois de um erro na compra, o mapa de assentos ficava desatualizado | Recarrega os assentos ocupados e limpa o carrinho |

## 3. Tela de Gêneros no Web (faltava)
O backend já tinha o CRUD de gêneros, mas o frontend não tinha uma tela para ele. Sem gênero não dá para cadastrar filme.
- `src/pages/generos/GenerosManager.tsx`: listar, criar, editar e excluir gêneros
- Rota `/generos` (exige login) e link **Gêneros** no menu do ADMIN
- `src/services/api.ts`: `createGenero`, `updateGenero`, `deleteGenero`
- `prisma/seed.ts`: cria gêneros padrão (Ação, Comédia, Drama...) se eles ainda não existirem
- `docker-compose.yml`: removido o atributo `version`, que está obsoleto

## 4. Mobile atualizado para o Expo SDK 58
Para abrir no Expo Go atual (SDK 58):
- `expo` 54 → **58.0.25**, `react-native` 0.81 → **0.88.1**, `react` 19.1 → **19.3**, mais os módulos `expo-*` alinhados com o SDK 58 (`npx expo install --fix`)
- React Navigation 6 → **7** (`native`, `native-stack`, `bottom-tabs`). Ajustes: `navigationInChildEnabled` no `NavigationContainer` e navegação explícita `Main → Minha Conta` no checkout
- `StatusBar`: removido o `backgroundColor`, que não existe no modo edge-to-edge (obrigatório no SDK novo)
- `typescript` ~5.9 e `@types/react` ~19.3
- `Dockerfile` do mobile: Node 22 (o SDK 58 exige Node ≥ 22.13) e removido o `expo-cli` global, que está descontinuado
- Validado com `tsc --noEmit` e `npx expo export --platform android` (o bundle foi gerado sem erros)

## 5. Preparação para rodar em outro PC
- `docker-compose.yml`: o banco agora fica exposto na porta **5433** do PC, para não conflitar com um PostgreSQL local. O backend continua usando `cineweb-db:5432` pela rede interna
- `sistema-cineWeb-backend/.env.example`: `DATABASE_URL` aponta para `localhost:5433` (usada pelo Prisma Studio e por quem roda o backend fora do Docker)
- Mobile com suporte a navegador (plano B): instalados `react-native-web`, `react-dom` e `@expo/metro-runtime`
- `src/utils/alert.ts`: no navegador, o `Alert.alert` do React Native não exibe nada, então os avisos (compra, comprovante e notificação do Kafka) passaram a usar `window.alert`/`confirm` na web
- Swagger: `GET /auth/me` e `POST /auth/logout` agora usam o token do botão **Authorize**
- README: seção "Rodando em outro PC"

## Verificação
- Mobile: `npx tsc --noEmit` sem erros.
- Frontend: `tsc -b` sem erros.
- Backend: compila sem erros nos arquivos novos e alterados.
