# Uso de IA no desenvolvimento

[← Voltar ao README](README.md)

Usei o Claude Code (Anthropic), no VS Code e no terminal, como ferramenta para entregar uma solução mais completa dentro do prazo do desafio, sem abrir mão de entender e decidir cada parte, além de desenvolver grande parte da aplicação. As decisões de produto e de arquitetura estão em [docs/solucao.md](docs/solucao.md) e [docs/arquitetura.md](docs/arquitetura.md).

## Para que usei

- **Acelerar a implementação**, seguindo a stack e a arquitetura definidas a partir do contexto (React, NestJS com mensageria, TypeScript, testes, arquitetura hexagonal e SOLID).
- **Apoiar a escrita dos testes**, com os testes ajustados a cada mudança de funcionalidade, de acordo com o novo comportamento.
- **Melhorias em pontos possivelmente fracos** do código.
- **Encontrar ferramentas para publicar a aplicação online**, no plano gratuito: Render (frontend e backend), Neon (PostgreSQL) e CloudAMQP (RabbitMQ).
- **Revisar a solução contra o desafio**, comparando o código com os critérios de avaliação e listando as melhorias antes de aplicá-las.
- **Testar as minhas decisões** com a skill `grill-me`.

## Como validei

- Build, lint, formatação e os 150 testes a cada mudança.
- Uso real no Docker e no navegador, no desktop e no celular, incluindo derrubar o RabbitMQ e o PostgreSQL para conferir as respostas da API e da tela.
- Revisão final de cada critério de avaliação contra a aplicação.
