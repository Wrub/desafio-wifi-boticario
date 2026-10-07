# Desafio Fullstack Wi-fi Grupo Boticario

Dashboard destinado ao proprietário de lojas O Boticário, para o acompanhamento do uso da rede Wi-Fi de visitantes.

## Execução do projeto

A execução requer o [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado e em funcionamento.

1. Para clonar o repositório e iniciar a aplicação, são utilizados os comandos a seguir:

   ```bash
   git clone https://github.com/Wrub/desafio-wifi-boticario.git
   cd desafio-wifi-boticario
   docker compose up -d --build
   ```

2. Após a inicialização, o dashboard fica disponível em http://localhost:8080. O banco de dados já é iniciado com lojas e conexões de exemplo.

3. Opcionalmente, novas conexões podem ser geradas pelo simulador:

   ```bash
   docker compose exec backend node scripts/simulate-connections.mjs 200
   ```

A aplicação é encerrada com `docker compose down`. Para remover também os dados, utiliza-se `docker compose down -v`.

## Testes

A execução dos testes requer o [Node.js 22+](https://nodejs.org/):

```bash
npm install
npm test
```
