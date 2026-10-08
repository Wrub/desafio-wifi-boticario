<!-- TODO: rotas e exemplos organizados. Falta revisar o conteúdo e apagar este comentário antes da entrega. -->

# API

[← Voltar ao README](../README.md)

URL publicada: `https://desafio-wifi-boticario-backend.onrender.com`. Localmente: `http://localhost:3000`.

> [!NOTE]
> No plano gratuito do Render a API é desligada quando fica parada. A primeira requisição pode levar cerca de 1 minuto.

Os formatos de entrada e saída estão definidos em `packages/shared/contracts/src/`. Os exemplos de resposta usam valores ilustrativos.

## Rotas

| Método | Rota                           | Descrição                                      |
| ------ | ------------------------------ | ---------------------------------------------- |
| POST   | `/connections`                 | registra uma conexão ao Wi-Fi                  |
| GET    | `/metrics/visits`              | total de visitas e visitantes únicos           |
| GET    | `/metrics/visits/distribution` | visitas por dia da semana, hora, mês e estação |
| GET    | `/stores`                      | lojas com visitas e visitantes únicos          |
| GET    | `/stores/:storeId/visitors`    | visitantes de uma loja, paginados              |
| GET    | `/health`                      | verifica se a API e o banco estão no ar        |

As rotas de consulta recebem o período em `from` e `to` (data ISO 8601). O período não pode passar de 366 dias, e `from` precisa ser menor ou igual a `to`.

## POST /connections

Registra uma conexão. A API valida, publica na fila e responde **202** antes de gravar; a conexão aparece no dashboard logo depois, quando o consumer grava no banco.

| Campo               | Obrigatório | Regra                                                                     |
| ------------------- | ----------- | ------------------------------------------------------------------------- |
| `storeId`           | sim         | id de uma loja existente (ex.: `loja-centro`)                             |
| `visitor.name`      | sim         | 2 a 120 caracteres                                                        |
| `visitor.phone`     | sim         | celular BR: DDD + 9 dígitos começando com 9, com ou sem `+55` e pontuação |
| `visitor.email`     | sim         | e-mail válido                                                             |
| `visitor.cpf`       | não         | 11 dígitos, com ou sem pontuação, com dígito verificador válido           |
| `device.macAddress` | sim         | `AA:BB:CC:DD:EE:FF` ou `AA-BB-CC-DD-EE-FF`                                |
| `device.type`       | sim         | `smartphone`, `tablet`, `laptop` ou `other`                               |
| `device.os`         | não         | até 40 caracteres                                                         |
| `connectedAt`       | não         | data ISO 8601; padrão é o momento da requisição; não pode ser futura      |

```bash
curl -X POST https://desafio-wifi-boticario-backend.onrender.com/connections \
  -H "Content-Type: application/json" \
  -d '{
    "storeId": "loja-centro",
    "visitor": { "name": "Maria Souza", "phone": "(41) 99999-8888", "email": "maria@email.com", "cpf": "529.982.247-25" },
    "device": { "macAddress": "AA:BB:CC:DD:EE:FF", "type": "smartphone", "os": "iOS 18" }
  }'
```

No PowerShell:

```powershell
$body = @{
  storeId = 'loja-centro'
  visitor = @{ name = 'Maria Souza'; phone = '(41) 99999-8888'; email = 'maria@email.com' }
  device  = @{ macAddress = 'AA:BB:CC:DD:EE:FF'; type = 'smartphone'; os = 'iOS 18' }
} | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri https://desafio-wifi-boticario-backend.onrender.com/connections -ContentType 'application/json' -Body $body
```

Resposta `202`:

```json
{ "id": "6f1c2b8e-3d4a-4b5c-9e7f-1a2b3c4d5e6f" }
```

## GET /metrics/visits

| Parâmetro | Obrigatório | Descrição           |
| --------- | ----------- | ------------------- |
| `from`    | sim         | início do período   |
| `to`      | sim         | fim do período      |
| `storeId` | não         | filtra por uma loja |

```bash
curl "https://desafio-wifi-boticario-backend.onrender.com/metrics/visits?from=2026-01-01&to=2026-10-07"
```

```json
{ "totalVisits": 5980, "uniqueVisitors": 2093 }
```

## GET /metrics/visits/distribution

| Parâmetro | Obrigatório | Descrição           |
| --------- | ----------- | ------------------- |
| `from`    | sim         | início do período   |
| `to`      | sim         | fim do período      |
| `storeId` | não         | filtra por uma loja |

Conta as visitas no horário de Brasília. Sempre devolve os 7 dias da semana (`0` = domingo), as 24 horas, os 12 meses (`1` = janeiro) e as 4 estações, com `0` onde não teve visita. As estações seguem o hemisfério sul pelo mês: verão de dezembro a fevereiro, outono de março a maio, inverno de junho a agosto e primavera de setembro a novembro.

```bash
curl "https://desafio-wifi-boticario-backend.onrender.com/metrics/visits/distribution?from=2025-10-08&to=2026-10-08"
```

```json
{
  "byWeekday": [
    { "weekday": 0, "visits": 770 },
    { "weekday": 6, "visits": 1357 }
  ],
  "byHour": [
    { "hour": 0, "visits": 0 },
    { "hour": 18, "visits": 848 }
  ],
  "byMonth": [
    { "month": 1, "visits": 461 },
    { "month": 12, "visits": 888 }
  ],
  "bySeason": [
    { "season": "verao", "visits": 1665 },
    { "season": "outono", "visits": 1541 },
    { "season": "inverno", "visits": 1401 },
    { "season": "primavera", "visits": 1393 }
  ]
}
```

O exemplo mostra só parte de `byWeekday`, `byHour` e `byMonth`; a resposta real traz todos os itens.

## GET /stores

| Parâmetro | Obrigatório | Descrição         |
| --------- | ----------- | ----------------- |
| `from`    | sim         | início do período |
| `to`      | sim         | fim do período    |

Devolve todas as lojas, inclusive as sem visita no período, das mais visitadas para as menos.

```json
[
  {
    "id": "loja-centro",
    "name": "Loja Centro",
    "city": "Curitiba",
    "totalVisits": 1890,
    "uniqueVisitors": 640
  }
]
```

## GET /stores/:storeId/visitors

| Parâmetro  | Obrigatório | Descrição                                |
| ---------- | ----------- | ---------------------------------------- |
| `from`     | sim         | início do período                        |
| `to`       | sim         | fim do período                           |
| `page`     | não         | página, a partir de 1 (padrão 1)         |
| `pageSize` | não         | itens por página, de 1 a 100 (padrão 10) |
| `search`   | não         | busca por parte do nome ou do e-mail     |

Os visitantes vêm ordenados pela última conexão, da mais recente para a mais antiga. O CPF sempre vem mascarado, e vem `null` quando a pessoa não informou.

```json
{
  "items": [
    {
      "id": "0b7c9e4a-2f1d-4c3b-8a6e-5d4f3c2b1a09",
      "name": "Maria Souza",
      "phone": "+5541999998888",
      "maskedCpf": "***.982.247-**",
      "email": "maria@email.com",
      "visits": 2,
      "visitTimes": ["2026-10-02T13:00:00.000Z", "2026-10-05T21:30:00.000Z"],
      "lastConnectedAt": "2026-10-05T21:30:00.000Z",
      "lastDevice": { "macAddress": "AA:BB:CC:DD:EE:FF", "type": "smartphone", "os": "iOS 18" }
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 1
}
```

Loja inexistente: `404`.

## GET /health

```json
{ "status": "ok" }
```

Responde `503` quando o banco não está acessível.

## Erros

Todos os erros seguem o mesmo formato:

```json
{
  "statusCode": 400,
  "message": "Dados inválidos",
  "issues": [{ "path": "visitor.phone", "message": "Celular inválido, use DDD + 9 dígitos" }]
}
```

| Status | Quando                                                                                                                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 400    | formato inválido (com `issues`) ou regra de negócio (CPF inválido, loja inexistente no registro, data futura, período maior que 366 dias) |
| 404    | loja não encontrada na lista de visitantes                                                                                                |
| 503    | RabbitMQ indisponível no registro, ou banco indisponível no `/health`                                                                     |
