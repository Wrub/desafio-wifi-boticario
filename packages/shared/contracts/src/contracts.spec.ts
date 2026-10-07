import { describe, expect, it } from 'vitest';
import { registerConnectionSchema, storeVisitorsQuerySchema, visitsQuerySchema } from './index.js';

const validPayload = {
  storeId: 'loja-centro',
  device: { macAddress: 'aa:bb:cc:dd:ee:ff', type: 'smartphone', os: 'Android 15' },
  visitor: { name: 'Maria Souza', cpf: '529.982.247-25', email: 'maria@email.com' },
};

describe('registerConnectionSchema', () => {
  it('aceita um payload válido', () => {
    expect(registerConnectionSchema.safeParse(validPayload).success).toBe(true);
  });

  it('recusa MAC inválido', () => {
    const result = registerConnectionSchema.safeParse({
      ...validPayload,
      device: { ...validPayload.device, macAddress: 'nao-e-mac' },
    });
    expect(result.success).toBe(false);
  });

  it('recusa e-mail inválido', () => {
    const result = registerConnectionSchema.safeParse({
      ...validPayload,
      visitor: { ...validPayload.visitor, email: 'maria' },
    });
    expect(result.success).toBe(false);
  });
});

describe('visitsQuerySchema', () => {
  it('converte as datas da query string', () => {
    const result = visitsQuerySchema.parse({ from: '2026-10-01', to: '2026-10-07' });
    expect(result.from).toBeInstanceOf(Date);
  });

  it('recusa período com from depois de to', () => {
    const result = visitsQuerySchema.safeParse({ from: '2026-10-07', to: '2026-10-01' });
    expect(result.success).toBe(false);
  });
});

describe('storeVisitorsQuerySchema', () => {
  it('usa página 1 e 10 itens quando não vem nada', () => {
    const result = storeVisitorsQuerySchema.parse({ from: '2026-10-01', to: '2026-10-07' });
    expect(result).toMatchObject({ page: 1, pageSize: 10 });
  });
});
