# A solução

[← Voltar ao README](../README.md)

## O problema

Realizar um dashboard com dados de visitantes que acessam o Wi-Fi de lojas do Boticário, para que stakeholders possam realizar decisões estratégicas e para que sejam possíveis realizações de campanhas e utilização de demais informações do cliente/usuário.

## O que é uma visita e quem é o visitante

Uma visita a loja é categorizada como um acesso ao Wi-Fi, passando por um suposto captive portal para garantir acesso a rede, visitante é o usuário, possível cliente ou conversão a venda, que realiza este acesso.

## Métricas escolhidas

| Nível     | Métrica                                 |
| --------- | --------------------------------------- |
| Rede      | Visitas na rede                         |
| Rede      | Visitantes únicos na rede               |
| Loja      | Visitas                                 |
| Loja      | Visitantes únicos                       |
| Loja      | Visitas por pessoa                      |
| Visitante | Visitas, dias e horários de cada visita |
| Visitante | Último aparelho usado                   |

## Dados do visitante e LGPD

Celular foi utilizado como chave principal para distinção entre acessos e para identificação do visitante, pois é um dado forte em termos de conversão e acionamento por outros meio de contato, realizando possíveis campanhas, além de possível vinculação com cadastro no aplicativo para envio de _push notifications_.

O CPF é opcional, para ficar de acordo com possíveis termos de LGPD, porém caso o visitante opte a informar, para cadastro e vinculação a um possível clube de benefícios ou recebimento de ofertas, é um dado interessante para tomada de decisão de stakeholders, visto que é possível relacionar este CPF com uma venda, podendo rastrear o comportamento do visitante e a conversão de venda.

## O captive portal

Realizei a simulação de um simples captive portal para acesso ao Wi-Fi, para demonstração visual das métricas e possibilidades imaginadas para a solução, demonstrando visualmente também a questão do CPF mencionada anteriormente, como métrica, resguardados a complexidade e restrições/possibilidades técnicas de aplicação real para usuários finais.

## Próximos passos

Para futuras versões, referente a implementações de melhoria relacionadas a métricas, poderiamos exibir mais métricas utilizando os dados de visitas ao acesso do Wi-Fi, como horários de pico, dias mais acessados, períodos do ano mais acessados em cada região, atrelados a uma visão macro mas possivelmente, para campanhas mais direcionadas, uma visão mais agrupada por visitantes, para envio de e-mail marketing, _push notifications_, mensagens de SMS ou WhatsApp.
