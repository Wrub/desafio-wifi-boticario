# Desafio Fullstack Wi-fi Grupo Boticario

Dashboard para o dono de lojas O Boticário acompanhar o uso do Wi-Fi de visitantes.

## Como rodar o projeto

Você só precisa ter o [Docker Desktop](https://www.docker.com/products/docker-desktop/) e o [Git](https://git-scm.com/) instalados.

1. Abra o Docker Desktop e espere ele terminar de iniciar.

2. Baixe o código:

   ```bash
   git clone https://github.com/Wrub/desafio-wifi-boticario.git
   cd desafio-wifi-boticario
   ```

3. Suba a aplicação:

   ```bash
   docker compose up -d --build
   ```

   Na primeira vez demora alguns minutos.

4. Espere o backend ficar pronto. Acompanhe os logs até aparecer `API rodando na porta 3000` e depois saia com `Ctrl + C`:

   ```bash
   docker compose logs -f backend
   ```

5. Abra o dashboard em http://localhost:8080.

   O banco já vem com 5 lojas e 1.500 conexões de exemplo. Clique em uma loja para ver os detalhes dela.

6. (Opcional) Gere novas conexões, como se fossem clientes entrando no Wi-Fi, e depois atualize o dashboard:

   ```bash
   docker compose exec backend node scripts/simulate-connections.mjs 200
   ```

7. Para parar tudo:

   ```bash
   docker compose down
   ```

   Para apagar os dados e começar de novo com os dados de exemplo:

   ```bash
   docker compose down -v
   docker compose up -d --build
   ```

## Rodar os testes

Precisa do [Node.js 22+](https://nodejs.org/) instalado.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Rode os testes:

   ```bash
   npm test
   ```
