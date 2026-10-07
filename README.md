<!-- TODO: estrutura e seções organizadas. Falta escrever a introdução, adicionar os prints em docs/img/ e apagar estes comentários antes da entrega. -->

# Desafio Fullstack Wi-fi Grupo Boticario

Dashboard destinado ao proprietário de lojas O Boticário, para o acompanhamento do uso da rede Wi-Fi de visitantes.

<!-- escrever: 2 ou 3 frases sobre o que o dashboard mostra e qual decisão ele ajuda a tomar. -->

## Acesso online

> [!IMPORTANT]
> O backend está no plano gratuito do Render e é desligado quando fica parado. Antes de usar o dashboard ou o portal, é necessário acessar a [URL da API](https://desafio-wifi-boticario-backend.onrender.com/health) e **aguardar cerca de 1 minuto** até ela responder `{"status":"ok"}`. Sem isso, a primeira carga do dashboard mostra erro de conexão.

| Aplicação      | URL                                                        |
| -------------- | ---------------------------------------------------------- |
| Dashboard      | https://desafio-wifi-boticario.onrender.com/               |
| Captive portal | https://desafio-wifi-boticario.onrender.com/portal         |
| API            | https://desafio-wifi-boticario-backend.onrender.com        |
| Health check   | https://desafio-wifi-boticario-backend.onrender.com/health |

<!-- adicionar prints: docs/img/dashboard.png e docs/img/portal.png -->

## Execução do projeto

A execução requer o [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em funcionamento.

1. Para clonar o repositório e iniciar a aplicação, são utilizados os comandos a seguir:

   ```bash
   git clone https://github.com/Wrub/desafio-wifi-boticario.git
   cd desafio-wifi-boticario
   docker compose up -d --build
   ```

2. Após a inicialização, os serviços ficam disponíveis nos endereços abaixo. O banco de dados já é iniciado com lojas e conexões de exemplo.

   | Serviço            | Endereço                                         |
   | ------------------ | ------------------------------------------------ |
   | Dashboard          | http://localhost:8080                            |
   | Captive portal     | http://localhost:8080/portal                     |
   | API                | http://localhost:3000                            |
   | Painel do RabbitMQ | http://localhost:15672 (usuário e senha: `wifi`) |

3. Opcionalmente, novas conexões podem ser geradas pelo simulador:

   ```bash
   docker compose exec backend node scripts/simulate-connections.mjs 200
   ```

A aplicação é encerrada com `docker compose down`. Para remover também os dados, utiliza-se `docker compose down -v`. Esse comando também é necessário depois de uma mudança no schema do banco, já que o seed só roda com o banco vazio.

## Testes

A execução dos testes requer o [Node.js 22+](https://nodejs.org/):

```bash
npm install
npm test
```

São 102 testes: 13 nos contratos, 48 no backend e 41 no frontend.

## Stack

| Camada         | Tecnologia                                                           |
| -------------- | -------------------------------------------------------------------- |
| Linguagem      | TypeScript 6 em todo o projeto                                       |
| Contratos      | Zod 4, compartilhado entre backend e frontend (npm workspaces)       |
| Backend        | NestJS 12, TypeORM 1.1, PostgreSQL 17                                |
| Mensageria     | RabbitMQ 4 (`@nestjs/microservices`, amqplib)                        |
| Frontend       | React 19, Vite 7, Tailwind CSS 4, date-fns 4                         |
| Testes         | Vitest 4, Testing Library                                            |
| Qualidade      | Prettier, oxlint                                                     |
| Infraestrutura | Docker (multi-stage), Docker Compose, nginx                          |
| Deploy         | Render (frontend e backend), Neon (PostgreSQL), CloudAMQP (RabbitMQ) |

## Documentação

- [A solução](docs/solucao.md): o problema, as métricas escolhidas e o porquê
- [Arquitetura](docs/arquitetura.md): visão geral, fluxo de uma conexão e contratos compartilhados
- [Backend](docs/backend.md): camadas, modelo de dados, tratamento de erros e configuração
- [Frontend](docs/frontend.md): telas, rotas e organização do código
- [API](docs/api.md): rotas, parâmetros e exemplos
- [Decisões técnicas](docs/decisoes.md)
- [Uso de IA no desenvolvimento](AI_USAGE.md)

## Limitações conhecidas

- **Dados pessoais sem criptografia no banco:** CPF e celular são armazenados em texto puro. Hoje a proteção está na API, que nunca devolve o CPF completo (sempre mascarado). Como evolução, os campos seriam criptografados (AES-GCM) e o CPF ganharia um hash (HMAC) para permitir a busca, já que hoje ele é indexado.
- **Sem dead-letter queue:** quando a gravação de uma conexão falha por um erro que não é de domínio (por exemplo, banco fora do ar), a mensagem volta para a fila a cada 2 segundos, sem limite de tentativas. Isso garante que nada se perca em uma queda temporária, mas um erro permanente faria a mensagem circular indefinidamente. Como evolução, o consumer contaria as tentativas e, após N falhas, moveria a mensagem para uma fila `wifi_connections.dlq`, onde poderia ser analisada e reprocessada.

Outras decisões e trade-offs estão em [Decisões técnicas](docs/decisoes.md).
