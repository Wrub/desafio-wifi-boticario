# A solução e decisões técnicas

[← Voltar ao README](../README.md)

## O problema

O desafio parte do ponto de vista do dono de uma loja de uma das franquias do Grupo Boticário, que quer visibilidade sobre o acesso dos clientes ao Wi-Fi de visitantes para tomar decisões estratégicas.

A proposta é um dashboard com os dados de quem acessa o Wi-Fi das lojas, para que o dono da loja e demais stakeholders possam tomar decisões e realizar campanhas e outras ações com base nesses dados. O dashboard responde três perguntas:

- **Quantas pessoas usam o Wi-Fi?** Acessos e usuários únicos, da rede e de cada loja.
- **Quando elas acessam?** Dia da semana, horário, mês e estação com mais acessos.
- **Quem são e quantas vezes voltam?** Lista de usuários com celular, CPF mascarado, quantidade de acessos e os dias e horários de cada um.

Como um mesmo dono pode ter mais de uma loja, o dashboard tem uma visão da rede, com todas as lojas, e uma visão de cada loja.

## O que é um acesso e quem é o usuário

Um acesso é um login no Wi-Fi da loja, feito por um captive portal (a tela que aparece antes de liberar a internet). O usuário é a pessoa que realiza esse login: um possível cliente ou uma possível conversão em venda.

Um acesso não é o mesmo que uma visita à loja: uma pessoa pode entrar na loja sem usar o Wi-Fi, e uma mesma visita pode gerar mais de um acesso, caso o celular desconecte e conecte novamente. Por isso o dashboard trata os números como acessos ao Wi-Fi, e não como visitas à loja.

## Métricas escolhidas

| Nível       | Métrica                                                | Para que serve                                                |
| ----------- | ------------------------------------------------------ | ------------------------------------------------------------- |
| Rede        | Acessos ao Wi-Fi e usuários únicos                     | tamanho do público que usa o Wi-Fi em todas as lojas          |
| Loja        | Acessos ao Wi-Fi e usuários únicos                     | comparar as lojas entre si (a lista vem ordenada por acessos) |
| Loja        | Acessos por pessoa                                     | recorrência: quantas vezes o cliente volta, em média          |
| Rede e loja | Dia da semana, horário, mês e estação com mais acessos | planejar equipe, horários e campanhas                         |
| Usuário     | Acessos, dias e horários de cada acesso                | histórico de cada cliente                                     |
| Usuário     | Último aparelho usado                                  | perfil do cliente (celular, notebook ou tablet)               |

### Padrões de acesso

Os padrões aparecem para a rede e para cada loja, com o pico em destaque e as barras de todos os valores, podendo ser filtrados em 30 dias ou 12 meses.

- **Horário mais acessado:** traz um dado relevante para o stakeholder tomar decisões baseadas na hora do dia, não necessariamente na hora específica, mas trazendo um panorama dos horários com mais e com menos acessos.
- **Dia da semana mais acessado:** um dos dados mais relevantes em termos de mapa de calor para tomadas de decisão, pois serve diretamente para a realização de campanhas, promoções e outras ações de marketing.
- **Mês mais acessado:** dado relevante para analisar datas especiais, como Dia das Mães, Dia dos Namorados, Black Friday e Natal.
- **Estação do ano mais acessada:** possibilidade de vincular campanhas à sazonalidade do ano, ao clima, entre outras variáveis, como uma campanha de primavera ou de inverno.

## Dados do usuário e LGPD

O celular foi utilizado como chave principal para identificar o usuário e distinguir os acessos, pois é um dado forte em termos de conversão e de contato por outros meios, permitindo campanhas, além de uma possível vinculação com o cadastro no aplicativo para envio de _push notifications_.

O CPF é opcional, para ficar de acordo com a LGPD. Porém, caso o usuário opte por informar, para cadastro e vinculação a um possível clube de vantagens ou recebimento de ofertas, é um dado interessante para a tomada de decisão de stakeholders, visto que é possível relacionar este CPF com uma venda, podendo rastrear o comportamento do cliente e a conversão em venda.

O CPF completo nunca sai da API: a lista de usuários devolve sempre o CPF mascarado (ex.: `***.982.247-**`).

## O captive portal

Realizei a simulação de um simples captive portal para acesso ao Wi-Fi, em `/portal`, para demonstração visual das métricas e das possibilidades imaginadas para a solução, demonstrando também a questão do CPF mencionada anteriormente, resguardadas a complexidade e as restrições técnicas de uma aplicação real para usuários finais.

O portal pede nome, celular e e-mail, oferece o CPF em troca do clube de vantagens e exige o aceite dos termos de uso. O aparelho é simulado (MAC aleatório, tipo e sistema tirados do navegador), já que em um portal real esses dados viriam do roteador. Após o login, o acesso aparece no dashboard em instantes. Para gerar volume, também há um simulador que envia conexões pela API (`apps/backend/scripts/simulate-connections.mjs`).

## Decisões técnicas

### Produto

- **Usuário identificado pelo celular, e não pelo CPF nem pelo aparelho.**
  - Permite a identificação no cadastro do aplicativo, para campanhas com _push notifications_, ou outras opções como SMS e WhatsApp. O aparelho não serve como chave, pois a mesma pessoa usa mais de um aparelho e troca de aparelho com o tempo.
- **CPF opcional, oferecido em troca do clube de vantagens.**
  - Seguindo a LGPD, o CPF não é obrigatório para acessar o Wi-Fi. Caso o usuário deseje informar e fazer parte de um possível clube de vantagens ou de ofertas, é possível atrelar a compra efetuada a este CPF e traçar a trajetória de comportamento do cliente.
- **Indicadores sempre nos últimos 12 meses; filtros de período nos padrões de acesso e na tabela de usuários.**
  - Os indicadores mantêm a visualização anual dos acessos, permitindo visualização sazonal. Os padrões de acesso podem ser filtrados em 30 dias ou 12 meses, para comparar o último mês com o último ano, e a tabela de usuários tem filtro próprio (Hoje, 7 dias, 30 dias ou 12 meses), cada filtro junto do componente em que atua.

### Arquitetura

- **Fila (RabbitMQ) entre o registro e a gravação, com resposta 202.**
  - O principal motivo é absorver picos de conexão em um cenário real: com milhares de lojas, muitas pessoas conectam ao mesmo tempo (ex.: sábado à tarde no shopping). A API valida, publica na fila e responde na hora, e o consumer grava no ritmo do banco. O fluxo completo está em [Fluxo de uma conexão](./arquitetura.md#fluxo-de-uma-conexão).
- **Existência da loja verificada na API, antes de publicar.**
  - É uma leitura pela chave primária em uma tabela pequena, bem mais barata que a gravação, e permite devolver o erro na hora (400), em vez de a mensagem ser descartada depois pelo consumer sem que o portal saiba.
- **Id da conexão gerado na API, antes de publicar (idempotência).**
  - O RabbitMQ entrega cada mensagem pelo menos uma vez. Com o id definido antes da publicação e `ON CONFLICT (id) DO NOTHING` na gravação, uma entrega repetida não duplica o acesso.
- **Arquitetura hexagonal no backend.**
  - O domínio e os casos de uso não conhecem Nest, TypeORM nem RabbitMQ: conversam com duas portas, o repositório e o publicador de eventos. Isso deixa as regras testáveis com fakes em memória e restringe uma troca de infraestrutura aos adaptadores. Foram mantidas só duas portas, para não criar camadas além do que o domínio pede.
- **Contratos Zod compartilhados entre backend e frontend.**
  - Um único pacote define os formatos de entrada e saída. O backend valida as requisições e as mensagens da fila com ele, e o frontend valida as respostas da API. Uma mudança de contrato quebra a compilação dos dois lados, e não a tela em produção.
- **Validação dupla: formato na borda (Zod) e regras no domínio.**
  - O Zod verifica o formato (campos, tipos e tamanhos), e o domínio verifica as regras (dígito verificador do CPF, celular, MAC e data não futura). O consumer valida novamente ao ler a fila, já que não é possível confiar totalmente no conteúdo de uma mensagem.

### Dados

- **Celular normalizado como chave do usuário.**
  - O celular é guardado sempre no formato `+5541999998888`, então `(41) 99999-8888` e `41999998888` são a mesma pessoa. A gravação faz um upsert pelo celular, atualizando nome e e-mail.
- **CPF opcional e sem `unique`.**
  - Como o CPF não é confirmado, uma restrição de unicidade faria o cadastro de uma pessoa bloquear o de outra que digitasse o mesmo número. O CPF tem apenas um índice, para busca.
- **CPF mantido quando a pessoa volta sem informar (`COALESCE` no upsert).**
  - Quem informou o CPF uma vez não perde o vínculo com o clube de vantagens ao se conectar novamente sem ele.
- **Aparelho guardado na conexão, sem tabela própria.**
  - O aparelho só interessa no contexto do acesso (o último aparelho usado), e uma tabela própria não traria ganho para as métricas atuais.
- **Padrões contados no horário de Brasília.**
  - O banco guarda as datas em UTC. Sem a conversão (`AT TIME ZONE 'America/Sao_Paulo'`), o pico das 18h apareceria às 21h.
- **Período máximo de 366 dias nas consultas.**
  - Cobre a visão anual do dashboard e limita o custo das consultas no banco.
- **SQL direto nas consultas de métrica, em vez do query builder.**
  - As consultas de métrica usam CTE, `UNION`, `JOIN LATERAL` e `AT TIME ZONE`, que ficam mais legíveis em SQL do que no query builder e podem ser analisadas diretamente com `EXPLAIN`. Todas são parametrizadas e ficam isoladas no adaptador do repositório. Operações simples, como verificar se uma loja existe, usam o ORM.
- **`DB_SYNC` (schema gerado pelas entidades) em vez de migrations.**
  - Com um schema pequeno e sem dados reais, gerar as tabelas pelas entidades agilizou o desenvolvimento. Em produção, o schema seria versionado com migrations.
- **Dados de exemplo gerados no boot.**
  - O seed cria 5 lojas e 6.000 conexões dos últimos 365 dias, com pesos por mês (calendário do varejo), dia da semana e horário, para os padrões do dashboard ficarem próximos do real. Usa uma semente fixa, então gera sempre os mesmos dados, e grava em lote, numa única transação, para o boot ser rápido no banco online.

### Frontend

- **Rotas sem biblioteca (History API).**
  - São apenas três rotas (`/`, `/lojas/:id` e `/portal`), então a History API resolve sem adicionar uma dependência.
- **Respostas da API validadas pelo contrato.**
  - Se o backend responder fora do formato esperado, a tela mostra uma mensagem de erro em vez de quebrar.
- **date-fns para formatar dias e horários.**
  - Formatação em português e no horário local, sem escrever a lógica de datas na mão.
- **Identidade visual do Grupo Boticário.**
  - Os tokens do Tailwind seguem as cores da marca (azul-marinho, creme, verde e laranja), com o logo no cabeçalho.
- **Layout pensado para celular e desktop.**
  - No celular, a lista de lojas vira uma faixa horizontal e os filtros ficam empilhados. No desktop, a lista de lojas pode ser recolhida para ampliar a área da loja.
- **Acessibilidade.**
  - Abas de lojas navegáveis pelas setas do teclado, rótulos nos campos e filtros, e foco visível em todos os botões.

## Tratamento de falhas

| Situação                                                       | Comportamento                                                                                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Dados inválidos no registro                                    | `400` com o campo e o motivo de cada erro, exibidos no campo correspondente do portal                                                       |
| Regra de negócio (CPF inválido, loja inexistente, data futura) | `400` com a mensagem                                                                                                                        |
| Loja inexistente na lista de usuários                          | `404`; no dashboard, aviso com botão para voltar à lista de lojas                                                                           |
| RabbitMQ fora do ar                                            | `503` imediato no registro; o dashboard continua funcionando, e o registro volta sozinho quando o RabbitMQ volta                            |
| Banco de dados fora do ar                                      | `503` em todas as rotas, com a mesma mensagem                                                                                               |
| Falha ao gravar no consumer                                    | mensagem inválida ou erro de domínio é descartado, com log; outro erro (ex.: banco fora) espera 2 segundos e devolve a mensagem para a fila |
| API fora do ar (no navegador)                                  | cada bloco mostra o erro com o botão "Tentar novamente"; ao trocar filtros rapidamente, a requisição anterior é cancelada                   |

Os detalhes estão em [Tratamento de erros](./backend.md#tratamento-de-erros) e em [Estados da interface](./frontend.md#estados-da-interface).

## Qualidade e publicação

- **150 testes automatizados:** 17 nos contratos, 81 no backend (domínio, casos de uso, filtro de erros e seed) e 52 no frontend (telas, filtros, busca e navegação pelo teclado, com a Testing Library).
- **Cenários de falha verificados na prática**, derrubando o RabbitMQ e o PostgreSQL no Docker Compose.
- **Publicação no plano gratuito:** Render (frontend estático e backend em Docker), Neon (PostgreSQL) e CloudAMQP (RabbitMQ).

## Limitações conhecidas

- **Dashboard sem autenticação:** o dashboard e a API não exigem login, então qualquer pessoa com o link visualiza nome, celular e e-mail dos usuários (o CPF é sempre mascarado). Em produção, cada dono de loja acessaria com login e veria somente as próprias lojas, e o `POST /connections` teria limite de requisições.
- **Dados pessoais sem criptografia no banco:** CPF e celular são armazenados em texto puro. Hoje a proteção está na API, que nunca devolve o CPF completo (sempre mascarado). Como evolução, os campos seriam criptografados e o CPF ganharia um hash para permitir a busca, já que hoje ele é indexado.
- **Registro depende do banco para validar a loja:** com o banco fora do ar, o `POST /connections` responde `503` em vez de enfileirar a conexão. A fila protege as gravações em andamento, não o registro de novas conexões. Como evolução, a lista de lojas ficaria em cache na API, já que muda raramente.
- **Acessos repetidos:** uma reconexão do celular, ou um reenvio do portal após um timeout, gera um novo acesso, já que cada requisição recebe um id novo. Como evolução, acessos do mesmo usuário na mesma loja dentro de uma janela de tempo (ex.: 30 minutos) contariam como um só nas métricas, mantendo os dados brutos no banco.
- **Horário da conexão aceito do cliente:** o `POST /connections` aceita um `connectedAt` no passado, usado pelo simulador para gerar histórico. Em um portal real, o horário seria definido pelo servidor ou pelo roteador.
- **Sem dead-letter queue:** quando a gravação de uma conexão falha por um erro que não é de domínio (por exemplo, banco fora do ar), a mensagem volta para a fila a cada 2 segundos, sem limite de tentativas. Isso garante que nada se perca em uma queda temporária, mas um erro permanente faria a mensagem circular indefinidamente. Como evolução, o consumer contaria as tentativas e, após N falhas, moveria a mensagem para uma fila onde poderia ser analisada e reprocessada.
- **Consultas SQL sem teste contra um banco real:** os casos de uso são testados com um repositório em memória, que valida as regras, mas não o SQL. Como evolução, testes de integração com um PostgreSQL real (ex.: Testcontainers).
- **Plano gratuito do Render:** o backend é desligado quando fica parado, então a primeira requisição pode levar cerca de 1 minuto.

## Próximos passos

Para futuras versões, poderíamos exibir mais métricas utilizando os dados de acesso ao Wi-Fi, como a comparação entre regiões e entre períodos (este mês em relação ao mês anterior), a proporção de usuários novos e recorrentes e, com o CPF do clube de vantagens, a conversão dos acessos em vendas.

Para campanhas mais direcionadas, além da visão macro, uma visão agrupada por usuários permitiria o envio de e-mail marketing, _push notifications_, mensagens de SMS ou WhatsApp.

Na parte técnica, os próximos passos seriam os itens das limitações acima: login por dono de loja (gerenciamento de acessos), criptografia dos dados pessoais, dead-letter queue, migrations versionadas e testes de integração com o banco.
