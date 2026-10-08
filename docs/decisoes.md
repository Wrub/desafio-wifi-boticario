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
-

## Limitações conhecidas

- **Dados pessoais sem criptografia no banco:** CPF e celular são armazenados em texto puro. Hoje a proteção está na API, que nunca devolve o CPF completo (sempre mascarado). Como evolução, os campos seriam criptografados e o CPF ganharia um hash para permitir a busca, já que hoje ele é indexado.
- **Sem dead-letter queue:** quando a gravação de uma conexão falha por um erro que não é de domínio (por exemplo, banco fora do ar), a mensagem volta para a fila a cada 2 segundos, sem limite de tentativas. Isso garante que nada se perca em uma queda temporária, mas um erro permanente faria a mensagem circular indefinidamente. Como evolução, o consumer contaria as tentativas e, após N falhas, moveria a mensagem para uma fila onde poderia ser analisada e reprocessada.
