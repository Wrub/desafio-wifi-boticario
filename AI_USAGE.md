# Uso de IA no desenvolvimento

[← Voltar ao README](README.md)

Usei IA durante todo o desenvolvimento, como ferramenta de engenharia, para entregar uma solução mais completa dentro do prazo do desafio, sem abrir mão de entender e decidir cada parte. Boa parte da implementação foi escrita com a IA, a partir das minhas especificações; as decisões de produto e de arquitetura, a revisão e a validação ficaram comigo. Esta página descreve como isso funcionou na prática.

## Ferramentas

- **Claude Code** (Anthropic), no VS Code e no terminal, usado em todo o ciclo: proposta da estrutura inicial, implementação das funcionalidades, testes automatizados, revisão de código, investigação de problemas, documentação e preparação para a apresentação da solução.

## Como usei

O fluxo foi parecido com o de programar em par: eu definia o problema e a direção, a IA propunha e implementava, e eu revisava, testava e decidia o que entrava no projeto.

1. **Contexto e direção.** Comecei pelo desafio e pelo contexto que ouvi nas conversas com o time: frontend em React, backend em NestJS com mensageria, tudo em TypeScript, com testes, arquitetura hexagonal e princípios SOLID. A partir disso, pedi uma proposta de estrutura e os passos para construir e entender a solução.
2. **Funcionalidades em incrementos pequenos.** Cada funcionalidade foi pedida separadamente, descrevendo o que eu queria ver na tela ou na API: tabela de lojas com os indicadores, tabela de usuários com nome, CPF, e-mail e aparelho, busca, lojas em abas, loja selecionada na URL, captive portal e padrões de acesso. Cada incremento virou um commit separado, com a mensagem escrita por mim.
3. **Entender antes de aceitar.** Pedi explicações simples sobre tudo o que eu ainda não dominava, até conseguir explicar com as minhas palavras: o funcionamento dos contratos, a camada de infraestrutura do backend, por que os casos de uso não usam decorators, por que Vite e nginx no frontend e por que SQL direto em vez de query builder.
4. **Revisões contra o desafio.** Em alguns momentos, pedi uma revisão do código e da aplicação comparando com os critérios de avaliação. Em uma delas, pedi as melhorias apenas como lista, sem aplicar, para escolher o que entraria.
5. **Testar as minhas decisões.** Usei a IA para me entrevistar como um avaliador faria, com perguntas sobre a fila, a idempotência e os acessos repetidos. Algumas respostas viraram ajustes no código, e outras viraram limitações documentadas.
6. **Documentação.** Defini a estrutura dos documentos e escrevi partes deles; outras partes foram redigidas com a IA a partir do código e revisadas por mim, para garantir que descrevem o que a aplicação realmente faz.

## O que eu decidi

### Produto

- **Captive portal e CPF opcional.** Pensando em como a coleta funcionaria em uma solução real, propus um captive portal simulado, com o CPF opcional, oferecido em troca de um clube de vantagens, de acordo com a LGPD.
- **Celular como chave do usuário**, e não o CPF nem o aparelho, por ser o dado mais útil para contato e campanhas.
- **Padrões de acesso** por dia da semana, horário, mês e estação, da rede e de cada loja, para apoiar campanhas e datas do varejo. Também ajustei os dados de exemplo ao horário real das lojas, a partir das 8h.
- **Acessos, e não visitas.** A loja não é visitada pelo Wi-Fi: o Wi-Fi é que é acessado. Por isso, todos os textos do dashboard tratam os números como acessos ao Wi-Fi, para o stakeholder interpretar os dados corretamente.
- **Visão padrão com o maior período (12 meses)**, para o stakeholder ver todos os dados, e o histórico de dias e horários de cada acesso na tabela de usuários.
- **Experiência das telas:** tela inicial sem loja selecionada, com a grade de lojas; lojas em abas à esquerda e a loja na URL; no celular, as lojas perto da tabela; lista de lojas recolhível; busca com botão de limpar; identidade visual do Grupo Boticário (cores do site e do Instagram, logo e favicon), com fundo creme no lugar do branco puro.

### Arquitetura e engenharia

- **Stack e direção arquitetural** (React, NestJS com fila, TypeScript, testes, arquitetura hexagonal e SOLID), a partir do contexto do time, com Docker para subir a solução completa e o monorepo organizado em `apps/`.
- **Simplificação do backend.** Com a primeira versão pronta, considerei que havia complexidade demais para um domínio pequeno, e as portas de leitura foram unificadas em um único repositório.
- **Chamadas de API do frontend separadas por responsabilidade**, uma para o dashboard e outra para o portal.
- **Versões exatas das dependências** (`.npmrc` com `save-exact`), para o projeto instalar sempre o que foi desenvolvido e testado.
- **Comentários curtos, em português**, apenas onde explicam um porquê.

## O que aceitei, mudei ou recusei

### Aceitei, depois de entender o motivo

- **Fila com resposta 202 e id gerado na API**, o que torna a gravação idempotente quando o RabbitMQ entrega a mesma mensagem mais de uma vez.
- **Contratos Zod compartilhados** entre backend e frontend, validando requisições, mensagens da fila e respostas da API.
- **SQL direto nas consultas de métrica**, depois de comparar com o query builder: as consultas usam CTE, `UNION` e `JOIN LATERAL`, que ficam mais legíveis em SQL.
- **date-fns em vez de Day.js**, depois de comparar as duas bibliotecas.
- **Filtro dos padrões apenas com 30 dias e 12 meses.** A IA apontou que, em períodos curtos, os gráficos de mês e estação ficariam com uma única barra; das opções apresentadas, escolhi limitar o filtro.
- **Banco de dados fora do ar respondendo 503**, com mensagem em português, ponto encontrado na revisão final ao derrubar o PostgreSQL.

### Mudei

- **Comentários:** os gerados eram longos e explicativos demais; reduzi a poucos, curtos e em português.
- **Backend:** de quatro portas para duas (repositório e publicador de eventos).
- **Tema:** a primeira versão com as cores da marca ficou verde demais; pedi a mistura com o creme e o azul-marinho, e cinza nos filtros e gráficos.
- **Detalhes de interface depois de usar as telas:** botão de voltar mais convencional, transições ao passar o mouse, layout dos filtros no celular e cabeçalho da tabela.

### Recusei

- **Dead-letter queue:** cheguei a pedir uma versão simples, mas preferi não implementar e documentar como limitação e próximo passo.
- **Factory pattern e casos de uso em pastas separadas no NestJS:** avaliei e não implementei, por não trazer ganho para o tamanho do projeto.
- **Swagger e nestjs-zod:** a documentação da API fica em [docs/api.md](docs/api.md), e os contratos Zod já são a fonte dos formatos.
- **Melhorias aplicadas automaticamente:** na revisão de código, pedi as melhorias como lista, para decidir uma a uma.

## Como validei

- **Automatizado, a cada mudança:** build, lint (oxlint), formatação (Prettier) e os 150 testes (contratos, backend e frontend).
- **Revisão antes de cada commit:** commits separados por funcionalidade, com mensagens escritas por mim, e perguntas sobre o que mudou em cada arquivo quando algo não estava claro.
- **Uso real da aplicação**, no Docker e no navegador, no desktop e no celular. Foi assim que encontrei, por exemplo, o seed incompleto no ambiente publicado e uma validação de celular mais restritiva do que eu queria no portal.
- **Cenários de falha:** derrubando o RabbitMQ e o PostgreSQL, para conferir as respostas da API e o que aparece na tela.
- **Revisão final contra o desafio:** cada critério de avaliação comparado com a aplicação, o que gerou ajustes no código e na documentação.

## Limites e cuidados

- **Hipóteses precisam de teste.** Em um momento, a IA supôs que a publicação na fila travaria com o RabbitMQ fora do ar; o teste mostrou uma resposta 503 imediata e a recuperação automática quando o RabbitMQ voltava.
- **Funcionar localmente não é funcionar em produção.** O seed gravava uma conexão por vez; no banco publicado isso levava minutos, e o Render reiniciava a aplicação no meio, deixando os dados pela metade. A correção foi gravar em lote, em uma única transação.
- **Versões recentes de bibliotecas.** Com o NestJS 12, a tipagem do consumer da fila precisou de ajuste, porque a sugestão inicial seguia versões anteriores do framework.
- **Excesso de estrutura.** A primeira versão trazia mais camadas do que o domínio pedia, e foi simplificada.
- **Ações com efeito externo.** A IA chegou a enviar uma conexão de teste para a API publicada sem perguntar e a tentar acessar o repositório remoto sem necessidade. Ações em produção, no banco e no repositório remoto precisam ser confirmadas antes.
- **Dados pessoais.** Todos os dados de exemplo são fictícios, gerados por uma semente fixa; nenhum dado real de cliente foi usado ou enviado para a IA.
