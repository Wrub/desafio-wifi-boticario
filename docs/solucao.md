# A solução e decisões técnicas

[← Voltar ao README](../README.md)

## O problema

Realizar um dashboard com dados de visitantes que acessam o Wi-Fi de lojas do Boticário, para que stakeholders possam realizar decisões estratégicas e para que sejam possíveis realizações de campanhas e utilização de demais informações do cliente/usuário.

## O que é uma visita e quem é o visitante

Uma visita a loja é categorizada como um acesso ao Wi-Fi, passando por um suposto captive portal para garantir acesso a rede, visitante é o usuário, possível cliente ou conversão a venda, que realiza este acesso.

## Métricas escolhidas

| Nível     | Métrica                                           |
| --------- | ------------------------------------------------- |
| Rede      | Visitas na rede                                   |
| Rede      | Visitantes únicos na rede                         |
| Loja      | Visitas                                           |
| Loja      | Visitantes únicos                                 |
| Loja      | Visitas por pessoa                                |
| Rede      | Dia da semana, horário e estação com mais visitas |
| Loja      | Dia da semana, horário e estação com mais visitas |
| Visitante | Visitas, dias e horários de cada visita           |
| Visitante | Último aparelho usado                             |

## Dados do visitante e LGPD

Celular foi utilizado como chave principal para distinção entre acessos e para identificação do visitante, pois é um dado forte em termos de conversão e acionamento por outros meio de contato, realizando possíveis campanhas, além de possível vinculação com cadastro no aplicativo para envio de _push notifications_.

O CPF é opcional, para ficar de acordo com possíveis termos de LGPD, porém caso o visitante opte a informar, para cadastro e vinculação a um possível clube de benefícios ou recebimento de ofertas, é um dado interessante para tomada de decisão de stakeholders, visto que é possível relacionar este CPF com uma venda, podendo rastrear o comportamento do visitante e a conversão de venda.

## O captive portal

Realizei a simulação de um simples captive portal para acesso ao Wi-Fi, para demonstração visual das métricas e possibilidades imaginadas para a solução, demonstrando visualmente também a questão do CPF mencionada anteriormente, como métrica, resguardados a complexidade e restrições/possibilidades técnicas de aplicação real para usuários finais.

## Decisões técnicas

### Produto

- **Visitante identificado pelo celular, e não pelo CPF nem pelo aparelho.**
  - Para permitir a identificação no cadastro do aplicativo, para campanha com push notifications, ou outras opções como SMS ou WhatsApp.
- **CPF opcional, oferecido em troca do clube de vantagens.**
  - Seguindo a LGPD, não tornando o CPF obrigatório para acesso ao Wi-Fi, caso o usuário deseje informar e fazer parte de um possível clube de vantagens ou de ofertas, é possível atrelar isso a compra efetuada sobre este CPF e traçar a trajetória de comportamento do cliente.
- **Indicadores sempre nos últimos 12 meses; filtro de período só na tabela de visitantes.**
  - Para que stakeholders tenham uma visualização anual dos acessos, permitindo visualização sazonal [visualizar o tópico de implementações futuras](./solucao.md#próximos-passos)

### Arquitetura

- **Fila (RabbitMQ) entre o registro e a gravação, com resposta 202.**
- **Id da conexão gerado na API, antes de publicar (idempotência).**
- **Arquitetura hexagonal no backend.**
- **Contratos Zod compartilhados entre backend e frontend.**
- **Validação dupla: formato na borda (Zod) e regras no domínio.**

### Dados

- **CPF opcional e sem `unique`.**
- **CPF mantido quando a pessoa volta sem informar (`COALESCE` no upsert).**
- **Aparelho guardado na conexão, sem tabela própria.**
- **Período máximo de 366 dias nas consultas.**
- **SQL direto nas consultas de métrica, em vez do query builder.**
- **`DB_SYNC` (schema gerado pelas entidades) em vez de migrations.**

### Frontend

- **Rotas sem biblioteca (History API).**
- **Respostas da API validadas pelo contrato.**
- **date-fns para formatar dias e horários.**

## Limitações conhecidas

- **Dados pessoais sem criptografia no banco:** CPF e celular são armazenados em texto puro. Hoje a proteção está na API, que nunca devolve o CPF completo (sempre mascarado). Como evolução, os campos seriam criptografados e o CPF ganharia um hash para permitir a busca, já que hoje ele é indexado.
- **Sem dead-letter queue:** quando a gravação de uma conexão falha por um erro que não é de domínio (por exemplo, banco fora do ar), a mensagem volta para a fila a cada 2 segundos, sem limite de tentativas. Isso garante que nada se perca em uma queda temporária, mas um erro permanente faria a mensagem circular indefinidamente. Como evolução, o consumer contaria as tentativas e, após N falhas, moveria a mensagem para uma fila onde poderia ser analisada e reprocessada.

## Próximos passos

Para futuras versões, referente a implementações de melhoria relacionadas a métricas, poderiamos exibir mais métricas utilizando os dados de visitas ao acesso do Wi-Fi, como horários de pico, dias mais acessados, períodos do ano mais acessados em cada região, atrelados a uma visão macro mas possivelmente, para campanhas mais direcionadas, uma visão mais agrupada por visitantes, para envio de e-mail marketing, _push notifications_, mensagens de SMS ou WhatsApp.
