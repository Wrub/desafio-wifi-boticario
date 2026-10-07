import type { DeviceProps } from '../../../domain/device.js';
import type { VisitorProps } from '../../../domain/visitor.js';
import type { WifiConnectionProps } from '../../../domain/wifi-connection.js';
import { StoreOrmEntity } from '../store.orm-entity.js';

// Lojas de exemplo. Não tem cadastro de loja no desafio, então elas nascem no boot.
export const DEMO_STORES: StoreOrmEntity[] = [
  { id: 'loja-centro', name: 'Loja Centro', city: 'Curitiba' },
  { id: 'loja-batel', name: 'Loja Batel', city: 'Curitiba' },
  { id: 'loja-shopping-norte', name: 'Shopping Norte', city: 'São Paulo' },
  { id: 'loja-aeroporto', name: 'Aeroporto', city: 'Rio de Janeiro' },
  { id: 'loja-orla', name: 'Orla', city: 'Florianópolis' },
];

// peso = quanto movimento cada loja tem
const STORE_WEIGHTS: Array<[string, number]> = [
  ['loja-centro', 5],
  ['loja-shopping-norte', 4],
  ['loja-batel', 3],
  ['loja-aeroporto', 2],
  ['loja-orla', 1],
];

// loja abre 10h e fecha 22h, pico no almoço e depois do trabalho
const HOUR_WEIGHTS: Array<[number, number]> = [
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

const DEVICE_OPTIONS: Array<[{ type: string; systems: Array<string | undefined> }, number]> = [
  [{ type: 'smartphone', systems: ['Android 14', 'Android 15', 'iOS 17', 'iOS 18'] }, 7],
  [{ type: 'laptop', systems: ['Windows 11', 'macOS 15', 'Ubuntu 24.04'] }, 2],
  [{ type: 'tablet', systems: ['iPadOS 18', 'Android 14'] }, 1],
  [{ type: 'other', systems: [undefined] }, 0.5],
];

// Random com semente (mulberry32): o seed gera sempre os mesmos dados,
// fica mais fácil comparar o dashboard entre uma execução e outra.
function createRandom(seed: number) {
  let state = seed;
  const next = () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (max: number) => Math.floor(next() * max);
  const pick = <T>(list: T[]) => list[int(list.length)];
  const weighted = <T>(entries: Array<[T, number]>) => {
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let roll = next() * total;
    for (const [value, weight] of entries) {
      roll -= weight;
      if (roll <= 0) return value;
    }
    return entries[0][0];
  };
  return { next, int, pick, weighted };
}

type Random = ReturnType<typeof createRandom>;

function cpf(random: Random): string {
  const digits = Array.from({ length: 9 }, () => random.int(10));
  for (const length of [9, 10]) {
    const sum = digits.reduce((acc, d, i) => acc + d * (length + 1 - i), 0);
    const rest = (sum * 10) % 11;
    digits.push(rest === 10 ? 0 : rest);
  }
  return digits.join('');
}

// DDDs das cidades das lojas
const AREA_CODES = ['41', '11', '21', '48'];

function phone(random: Random): string {
  const rest = Array.from({ length: 8 }, () => random.int(10)).join('');
  return `+55${random.pick(AREA_CODES)}9${rest}`;
}

function mac(random: Random): string {
  return Array.from({ length: 6 }, () => random.int(256).toString(16).padStart(2, '0')).join(':');
}

// uuid v4 a partir do random com semente (o crypto.randomUUID não aceita semente)
function uuid(random: Random): string {
  const hex = Array.from({ length: 32 }, () => random.int(16).toString(16));
  hex[12] = '4';
  hex[16] = (8 + random.int(4)).toString(16);
  const s = hex.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`;
}

interface Person {
  visitor: VisitorProps;
  devices: DeviceProps[];
  homeStore: string;
}

function person(random: Random): Person {
  const first = random.pick(FIRST_NAMES);
  const last = random.pick(LAST_NAMES);
  const slug = `${first}.${last}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const device = (): DeviceProps => {
    const option = random.weighted(DEVICE_OPTIONS);
    return { macAddress: mac(random), type: option.type, os: random.pick(option.systems) };
  };

  return {
    visitor: {
      name: `${first} ${last}`,
      phone: phone(random),
      // CPF é opcional no portal: ~60% das pessoas informam
      cpf: random.next() < 0.6 ? cpf(random) : undefined,
      email: `${slug}${random.int(100)}@email.com`,
    },
    // 1 em cada 4 pessoas usa mais de um aparelho (celular + notebook, por ex.)
    devices: random.next() < 0.25 ? [device(), device()] : [device()],
    homeStore: random.weighted(STORE_WEIGHTS),
  };
}

export function generateDemoConnections(
  count: number,
  // 1 ano de dado pra visão padrão do dashboard (12 meses) mostrar algo diferente de 30 dias
  { now = new Date(), daysBack = 365, seed = 2026 } = {},
): WifiConnectionProps[] {
  const random = createRandom(seed);
  // ~35% de pessoas em relação às conexões: dá bastante cliente que volta
  const people = Array.from({ length: Math.max(10, Math.round(count * 0.35)) }, () =>
    person(random),
  );

  return Array.from({ length: count }, () => {
    const someone = random.pick(people);
    const connectedAt = new Date(now);
    connectedAt.setDate(connectedAt.getDate() - random.int(daysBack));
    connectedAt.setHours(random.weighted(HOUR_WEIGHTS), random.int(60), random.int(60), 0);
    // horário de hoje que ainda não chegou vira o mesmo horário de ontem
    if (connectedAt > now) connectedAt.setDate(connectedAt.getDate() - 1);

    return {
      id: uuid(random),
      // 80% das vezes a pessoa vai na loja "dela"
      storeId: random.next() < 0.8 ? someone.homeStore : random.weighted(STORE_WEIGHTS),
      connectedAt,
      device: random.pick(someone.devices),
      visitor: someone.visitor,
    };
  });
}
