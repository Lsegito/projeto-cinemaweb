# 🎬 CineWeb — Sistema de Gerenciamento de Cinema

Ecossistema completo para gerenciamento de cinema composto por **3 repositórios independentes** orquestrados via Git Submodules:

| Projeto | Stack | Repositório |
|---|---|---|
| **Backend** | NestJS + Prisma + PostgreSQL | [sistema-cineWeb-backend](./sistema-cineWeb-backend) |
| **Frontend** | React + Vite + Bootstrap 5 | [sistema-cineWeb-frontend](./sistema-cineWeb-frontend) |
| **Mobile** | React Native + Expo (SDK 58) + TypeScript | [sistema-cineWeb-mobile](./sistema-cineWeb-mobile) |

### Funcionalidades Principais

- 🔐 Autenticação JWT com Refresh Token (Access Token 15min + Refresh Token 7d)
- 👥 RBAC — Controle de acesso por perfil (ADMIN / CUSTOMER / Público)
- 📝 Fluxos completos de Cadastro e Recuperação de Senha
- 🎟️ Listagem pública de filmes e sessões (filtro dinâmico integrado)
- 🛒 Gestão de Pedidos completos no app (englobando múltiplos ingressos e lanches em uma única compra)
- 🎟️ Emissão de comprovante unificado detalhado com QR Code único validando o pedido inteiro
- 📄 Exportação nativa do comprovante em PDF e compartilhamento (Web e Mobile)
- 📱 Armazenamento local e sincronização offline (DB Sync no Mobile)
- 📣 Notificação de novos filmes com mensageria **Apache Kafka** (tópico `filmes.novos`)
- 🐳 Orquestração Docker com `docker compose`
- 📖 Documentação Swagger (API interativa em `/api`)

---

## 📁 Estrutura do Repositório

```
cineWeb/                        ← Repositório orquestrador
├── sistema-cineWeb-backend/    ← [Submódulo] API NestJS
├── sistema-cineWeb-frontend/   ← [Submódulo] SPA React + Vite
├── sistema-cineWeb-mobile/     ← [Submódulo] App Expo/React Native
├── docker-compose.yml          ← Orquestração unificada
├── .env.example                ← Template de variáveis de ambiente
└── README.md                   ← Este arquivo
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Git](https://git-scm.com/)
- [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/)
- [Node.js](https://nodejs.org/) **22.13 ou superior** (apenas para rodar o Mobile localmente)

### Passo a Passo

1. **Clone o repositório com os submódulos:**
   Como este repositório usa Git Submodules, clone com a flag `--recursive` para baixar o código dos repositórios filhos automaticamente.
   ```bash
   git clone --recursive https://github.com/eduardo-gms/sistema-cineWeb.git
   cd sistema-cineWeb
   ```
   *(Se você já clonou sem a flag, rode: `git submodule update --init --recursive`)*

2. **Configure as Variáveis de Ambiente:**
   Crie o arquivo `.env` na raiz do projeto baseado no exemplo fornecido.
   ```bash
   cp .env.example .env
   ```

3. **Inicie os Serviços (Backend, Frontend e Banco de Dados):**
   ```bash
   docker compose up -d --build
   ```
   - O Kafka estará disponível em: `localhost:9094` (dentro da rede Docker: `kafka:9092`)
   - O Backend estará disponível em: `http://localhost:3000`
   - O Frontend estará disponível em: `http://localhost:5173`
   - O Swagger UI estará disponível em: `http://localhost:3000/api`

4. **Inicie o Aplicativo Mobile (opcional):**
   Recomenda-se rodar o mobile fora do Docker para facilitar a comunicação com o Expo Go no celular físico.
   ```bash
   cd sistema-cineWeb-mobile
   npm install
   npx expo start
   ```

---

## 📣 Mensageria — Notificação de Novos Filmes (Apache Kafka)

```
 ADMIN (Web)            Backend (NestJS)                 Kafka                  Backend (consumidor)        Mobile / Web
 POST /filmes  ──►  FilmesService.create()  ──►  tópico "filmes.novos"  ──►  NotificacoesConsumer  ──►  GET /notificacoes
                    (KafkaProducerService)                                    grava "Notificacao"          (polling a cada 15s)
```

| Peça | Arquivo |
|---|---|
| Broker Kafka (modo KRaft, sem Zookeeper) | `docker-compose.yml` → serviço `kafka` |
| Produtor | `sistema-cineWeb-backend/src/kafka/kafka-producer.service.ts` |
| Publicação do evento ao cadastrar filme | `sistema-cineWeb-backend/src/filmes/filmes.service.ts` |
| Consumidor (grupo `cineweb-notificacoes`) | `sistema-cineWeb-backend/src/notificacoes/notificacoes.consumer.ts` |
| API de notificações | `GET /notificacoes?desde=<data ISO>` |
| Mobile (alerta "Novo filme em cartaz!") | `sistema-cineWeb-mobile/src/hooks/useNovosFilmesNotifier.ts` |

**Como demonstrar:**
1. Suba tudo com `docker compose up -d --build` e abra o app mobile (Expo Go).
2. No Web, entre como ADMIN e cadastre um filme novo.
3. Em até 15 segundos o celular mostra o alerta **"Novo filme em cartaz! 🎬"** e a lista de filmes é atualizada.
4. Para ver as mensagens direto no Kafka:
   ```bash
   docker exec -it cineweb-kafka /opt/kafka/bin/kafka-console-consumer.sh \
     --bootstrap-server localhost:9092 --topic filmes.novos --from-beginning
   ```
5. Logs do produtor/consumidor: `docker logs -f cineweb-backend`

> Se o Kafka estiver fora do ar, o cadastro do filme continua funcionando (o evento apenas não é publicado) e o consumidor fica tentando reconectar.

---

## 🔑 Credenciais de Teste (Seed)

Ao subir o backend pela primeira vez, o seed cria automaticamente um usuário administrador:

| Perfil | E-mail | Senha |
|--------|--------|-------|
| **ADMIN** | `admin@cineweb.com` | `admin123` |

> O **ADMIN** pode gerenciar filmes, salas, sessões, gêneros e lanches.

---

## 🏫 Rodando em outro PC (ex.: laboratório da faculdade)

1. **Docker Desktop** instalado e aberto, e **Node.js 22.13+** (`node -v`).
2. O banco do Docker fica na porta **5433** do PC. Assim ele não conflita com um PostgreSQL instalado no Windows.
3. `docker compose up -d --build` → na primeira vez baixa as imagens (Postgres, Kafka e Node), o que leva alguns minutos.
4. Mobile: `cd sistema-cineWeb-mobile`, `npm install` e `npx expo start -c`.
5. **Se o celular não conectar** (redes de faculdade costumam isolar os aparelhos):
   - **Plano B:** no terminal do Expo, aperte **`w`**. O app abre no navegador do PC, com as mesmas telas e o mesmo aviso de novo filme (Kafka).
   - Ou ligue o roteador do celular e conecte o PC nele (se o PC tiver Wi-Fi).
6. Se puder, libere a porta 3000 no firewall (PowerShell como administrador):
   `New-NetFirewallRule -DisplayName "CineWeb Backend 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow -Profile Any`

---

## ☁️ Como Executar no GitHub Codespaces

O GitHub Codespaces é um ambiente de desenvolvimento em nuvem perfeito para este projeto, pois já vem com Docker, Node.js e Git configurados.

### Passo 1: Criar o Codespace
1. Acesse este repositório no GitHub.
2. Clique no botão verde **Code** > aba **Codespaces** > **Create codespace on main**.
3. Aguarde o VS Code no navegador carregar (pode levar alguns minutos na primeira vez).

### Passo 2: Inicializar os Submódulos
Por padrão, o Codespaces clona o repositório, mas pode não inicializar os submódulos. No terminal do Codespace, execute:
```bash
git submodule update --init --recursive
```

### Passo 3: Configurar Variáveis e Subir o Docker
```bash
cp .env.example .env
docker compose up -d --build
```

### Passo 4: Configurar o Encaminhamento de Portas (Port Forwarding)
Para que o Frontend Web e o aplicativo Mobile consigam se comunicar com o Backend rodando na nuvem:
1. No painel inferior do VS Code, clique na aba **Ports** (Portas).
2. Você verá as portas `3000` (Backend) e `5173` (Frontend) ativas.
3. **MUITO IMPORTANTE:** Clique com o botão direito na porta `3000` (Backend), vá em **Port Visibility** e altere de `Private` para **`Public`**.
   > Sem fazer isso, o Frontend e o Mobile não conseguirão fazer requisições para a API devido às regras de CORS e autenticação do GitHub.
4. O GitHub gerará URLs públicas para essas portas (ex: `https://orange-robot-xxyyzz-3000.app.github.dev`).

### Passo 5: Executar o Mobile no Codespaces (Acesso via Expo Go)
1. Abra um novo terminal integrado no Codespace.
2. Navegue até a pasta mobile: `cd sistema-cineWeb-mobile`
3. Instale as dependências: `npm install`
4. Altere a URL da API no código do Mobile (`src/services/api.ts`) para a **URL Pública do Backend** gerada pelo Codespaces no Passo 4 (não use `localhost`).
5. Inicie o Expo: `npx expo start --tunnel`
   > A flag `--tunnel` é crucial em ambientes de nuvem. Ela gera um QR Code roteado via ngrok, permitindo que você escaneie o código com o app Expo Go no seu celular físico (em qualquer rede) e acesse a aplicação sendo desenvolvida no Codespaces.

---

## ⚠️ Erros Comuns e Boas Práticas

- **`Cannot find module 'kafkajs'` no backend:** o container reaproveita o volume anônimo antigo de `node_modules`. Rode `docker compose up -d --build -V` (ou `docker compose down -v` antes de subir de novo).
- **Submódulos Desatualizados:** Se outros desenvolvedores atualizarem o backend/frontend/mobile nos repositórios originais, o repositório pai não puxará essas alterações automaticamente. Para atualizar todos os filhos para o último commit, rode:
  ```bash
  git submodule update --remote
  ```
- **Problemas de CORS no Codespaces:** Sempre verifique se a porta `3000` está marcada como **Pública** na aba de portas. Se estiver privada, o frontend receberá um erro de conexão (`Network Error`).
- **Não comite o `.env`:** O arquivo `.env` está ignorado globalmente para segurança. Atualize apenas o `.env.example` caso adicione novas variáveis ao sistema.
- **Docker Compose V2:** Este projeto usa a sintaxe `docker compose` (sem hífen). Se você estiver com a versão V1 legada, use `docker-compose`.
