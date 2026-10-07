<!-- TODO: estrutura e seções organizadas. Falta escrever o conteúdo dos trechos marcados com "escrever" e apagar estes comentários antes da entrega. -->

# Decisões técnicas

[← Voltar ao README](../README.md)

<!-- escrever: para cada decisão, o contexto, o que foi escolhido e o trade-off.
Um parágrafo curto por item já é suficiente. -->

## Produto

- **Visitante identificado pelo celular, e não pelo CPF nem pelo aparelho.** <!-- escrever -->
- **CPF opcional, oferecido em troca do clube de vantagens.** <!-- escrever -->
- **CPF mascarado na API, celular exibido completo.** <!-- escrever -->
- **Indicadores sempre nos últimos 12 meses; filtro de período só na tabela de visitantes.** <!-- escrever -->

## Arquitetura

- **Fila (RabbitMQ) entre o registro e a gravação, com resposta 202.** <!-- escrever -->
- **Id da conexão gerado na API, antes de publicar (idempotência).** <!-- escrever -->
- **Arquitetura hexagonal no backend.** <!-- escrever -->
- **Contratos Zod compartilhados entre backend e frontend.** <!-- escrever -->
- **Validação dupla: formato na borda (Zod) e regras no domínio.** <!-- escrever -->

## Dados

- **CPF opcional e sem `unique`.** <!-- escrever: a pessoa pode trocar de número e manter o CPF. -->
- **CPF mantido quando a pessoa volta sem informar (`COALESCE` no upsert).** <!-- escrever -->
- **Aparelho guardado na conexão, sem tabela própria.** <!-- escrever -->
- **Período máximo de 366 dias nas consultas.** <!-- escrever -->
- **SQL direto nas consultas de métrica, em vez do query builder.** <!-- escrever -->
- **`DB_SYNC` (schema gerado pelas entidades) em vez de migrations.** <!-- escrever: simplicidade x mudanças de schema exigem recriar o banco. -->

## Frontend

- **Rotas sem biblioteca (History API).** <!-- escrever -->
- **Respostas da API validadas pelo contrato.** <!-- escrever -->
- **date-fns para formatar dias e horários.** <!-- escrever -->

## Fora do escopo

<!-- escrever: o que ficou de fora e por quê (dead-letter queue, criptografia, consentimento
de marketing, gráficos de horários de pico, novos x recorrentes). -->

As limitações conhecidas estão descritas no [README](../README.md#limitações-conhecidas).
