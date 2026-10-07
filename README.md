# Desafio Fullstack Wi-fi Grupo Boticario

Dashboard para o dono de lojas O Boticário acompanhar o uso do Wi-Fi de visitantes.

## Como rodar

Precisa do [Docker Desktop](https://www.docker.com/products/docker-desktop/) aberto.

1. Clone o repositório e suba tudo:

   ```bash
   git clone https://github.com/Wrub/desafio-wifi-boticario.git
   cd desafio-wifi-boticario
   docker compose up -d --build
   ```

2. Abra http://localhost:8080. O banco já vem com lojas e conexões de exemplo.

3. (Opcional) Gere mais conexões:

   ```bash
   docker compose exec backend node scripts/simulate-connections.mjs 200
   ```

Para parar, use `docker compose down`. Para apagar os dados também, `docker compose down -v`.

## Testes

Precisa do [Node.js 22+](https://nodejs.org/).

```bash
npm install
npm test
```
