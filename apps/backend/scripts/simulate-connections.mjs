// Simula clientes fazendo login no Wi-Fi das lojas (POST /connections).
//
// Uso:
//   node scripts/simulate-connections.mjs [quantidade] [urlDaApi]
//   node scripts/simulate-connections.mjs 300 http://localhost:3000
//

const count = Number(process.argv[2] ?? 200);
const apiUrl = process.argv[3] ?? process.env.API_URL ?? 'http://localhost:3000';

// mesmas lojas do seed (demo-data.ts); as primeiras recebem mais movimento
const STORES = [
  ['loja-centro', 5],
  ['loja-shopping-norte', 4],
  ['loja-batel', 3],
  ['loja-aeroporto', 2],
  ['loja-orla', 1],
];
const PEOPLE_COUNT = Math.max(10, Math.round(count * 0.35));
const DAYS_BACK = 365;
const AREA_CODES = ['41', '11', '21', '48'];
const HOUR_WEIGHTS = [
  [10, 2],
  [11, 4],
  [12, 8],
  [13, 7],
  [14, 4],
  [15, 3],
  [16, 4],
  [17, 6],
  [18, 9],
  [19, 8],
  [20, 5],
  [21, 2],
];

const FIRST_NAMES = [
  'Ana',
  'Beatriz',
  'Camila',
  'Daniela',
  'Fernanda',
  'Gabriela',
  'Juliana',
  'Larissa',
  'Mariana',
  'Patrícia',
  'Bruno',
  'Carlos',
  'Diego',
  'Felipe',
  'Gustavo',
  'João',
  'Lucas',
  'Marcelo',
  'Rafael',
  'Thiago',
];
const LAST_NAMES = [
  'Silva',
  'Santos',
  'Oliveira',
  'Souza',
  'Rodrigues',
  'Ferreira',
  'Alves',
  'Pereira',
  'Lima',
  'Gomes',
  'Costa',
  'Ribeiro',
  'Martins',
  'Carvalho',
  'Almeida',
];
const DEVICES = [
  ['smartphone', ['Android 14', 'Android 15', 'iOS 17', 'iOS 18']],
  ['tablet', ['iPadOS 18', 'Android 14']],
  ['laptop', ['Windows 11', 'macOS 15', 'Ubuntu 24.04']],
  ['other', [undefined]],
];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function weightedPick(entries) {
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[0][0];
}

// gera CPF com dígito verificador certo (o domínio recusa CPF inválido)
function randomCpf() {
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  for (const length of [9, 10]) {
    const sum = digits.reduce((acc, d, i) => acc + d * (length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    digits.push(rest === 10 ? 0 : rest);
  }
  return digits.join('');
}

// celular BR: DDD + 9 + 8 dígitos
function randomPhone() {
  const rest = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('');
  return `+55${pick(AREA_CODES)}9${rest}`;
}

function randomMac() {
  return Array.from({ length: 6 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0'),
  ).join(':');
}

function randomDevice() {
  const [type, systems] = weightedPick([
    [DEVICES[0], 7],
    [DEVICES[1], 1],
    [DEVICES[2], 2],
    [DEVICES[3], 0.5],
  ]);
  return { macAddress: randomMac(), type, os: pick(systems) };
}

function randomPerson() {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const slug = `${first}.${last}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return {
    visitor: {
      name: `${first} ${last}`,
      phone: randomPhone(),
      // CPF é opcional: ~60% informam
      cpf: Math.random() < 0.6 ? randomCpf() : undefined,
      email: `${slug}${Math.floor(Math.random() * 100)}@email.com`,
    },
    devices: Array.from({ length: Math.random() < 0.25 ? 2 : 1 }, randomDevice),
    homeStore: weightedPick(STORES),
  };
}

function randomPastDate() {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * DAYS_BACK));
  date.setHours(
    weightedPick(HOUR_WEIGHTS),
    Math.floor(Math.random() * 60),
    Math.floor(Math.random() * 60),
    0,
  );
  // horário de hoje que ainda não chegou vira o de ontem
  if (date > new Date()) date.setDate(date.getDate() - 1);
  return date;
}

const people = Array.from({ length: PEOPLE_COUNT }, randomPerson);

let ok = 0;
let failed = 0;
for (let i = 0; i < count; i++) {
  const person = pick(people);
  const body = {
    storeId: Math.random() < 0.8 ? person.homeStore : weightedPick(STORES),
    device: pick(person.devices),
    visitor: person.visitor,
    connectedAt: randomPastDate().toISOString(),
  };
  try {
    const response = await fetch(`${apiUrl}/connections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (response.ok) ok++;
    else {
      failed++;
      console.error(`HTTP ${response.status}:`, await response.text());
    }
  } catch (error) {
    failed++;
    console.error('Falha na requisição:', error.message);
  }
}

console.log(`Pronto. ${ok} aceitas, ${failed} com erro, ${PEOPLE_COUNT} pessoas diferentes.`);
