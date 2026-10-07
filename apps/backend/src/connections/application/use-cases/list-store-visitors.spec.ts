import { beforeEach, describe, expect, it } from 'vitest';
import { connection, CPF_ANA, CPF_JOAO, CPF_MARIA } from '../../../../test/fakes/builders.js';
import { InMemoryConnectionRepository } from '../../../../test/fakes/in-memory-connection.repository.js';
import { NotFoundError } from '../../domain/domain.error.js';
import { ListStoreVisitors } from './list-store-visitors.js';

const october = { from: new Date('2026-10-01T00:00:00Z'), to: new Date('2026-10-07T23:59:59Z') };

describe('ListStoreVisitors', () => {
  let useCase: ListStoreVisitors;

  beforeEach(async () => {
    const connections = new InMemoryConnectionRepository([
      { id: 'loja-centro', name: 'Centro', city: 'Curitiba' },
      { id: 'loja-batel', name: 'Batel', city: 'Curitiba' },
    ]);
    const maria = { name: 'Maria', cpf: CPF_MARIA, email: 'maria@email.com' };

    await connections.save(
      connection({ id: '1', visitor: maria, connectedAt: new Date('2026-10-02T10:00:00Z') }),
    );
    await connections.save(
      connection({
        id: '2',
        visitor: maria,
        device: { macAddress: '11:22:33:44:55:66', type: 'laptop', os: 'Windows 11' },
        connectedAt: new Date('2026-10-05T18:00:00Z'),
      }),
    );
    await connections.save(
      connection({
        id: '3',
        visitor: { name: 'João', cpf: CPF_JOAO, email: 'joao@email.com' },
        connectedAt: new Date('2026-10-03T12:00:00Z'),
      }),
    );
    await connections.save(
      connection({
        id: '4',
        storeId: 'loja-batel',
        visitor: { name: 'Ana', cpf: CPF_ANA, email: 'ana@email.com' },
      }),
    );

    useCase = new ListStoreVisitors(connections);
  });

  it('lista os visitantes da loja com o último aparelho usado', async () => {
    const result = await useCase.execute(
      { ...october, storeId: 'loja-centro' },
      { page: 1, pageSize: 10 },
    );

    expect(result.total).toBe(2);
    expect(result.items[0]).toMatchObject({
      name: 'Maria',
      visits: 2,
      lastDevice: { macAddress: '11:22:33:44:55:66', type: 'laptop', os: 'Windows 11' },
    });
    expect(result.items[1].name).toBe('João');
  });

  it('devolve o horário de cada visita, da primeira pra última', async () => {
    const result = await useCase.execute(
      { ...october, storeId: 'loja-centro' },
      { page: 1, pageSize: 10 },
    );

    expect(result.items[0].visitTimes).toEqual([
      new Date('2026-10-02T10:00:00Z'),
      new Date('2026-10-05T18:00:00Z'),
    ]);
  });

  it('nunca devolve o CPF completo', async () => {
    const result = await useCase.execute(
      { ...october, storeId: 'loja-centro' },
      { page: 1, pageSize: 10 },
    );

    expect(result.items[0].maskedCpf).toBe('***.982.247-**');
    expect(JSON.stringify(result)).not.toContain(CPF_MARIA);
  });

  it('pagina o resultado', async () => {
    const result = await useCase.execute(
      { ...october, storeId: 'loja-centro' },
      { page: 2, pageSize: 1 },
    );

    expect(result.total).toBe(2);
    expect(result.items.map((i) => i.name)).toEqual(['João']);
  });

  it('busca por pedaço do nome, sem diferenciar maiúscula', async () => {
    const result = await useCase.execute(
      { ...october, storeId: 'loja-centro', search: 'JOÃ' },
      { page: 1, pageSize: 10 },
    );

    expect(result.total).toBe(1);
    expect(result.items.map((i) => i.name)).toEqual(['João']);
  });

  it('busca por e-mail', async () => {
    const result = await useCase.execute(
      { ...october, storeId: 'loja-centro', search: 'maria@' },
      { page: 1, pageSize: 10 },
    );
    expect(result.items.map((i) => i.name)).toEqual(['Maria']);
  });

  it('busca só com espaços é o mesmo que não buscar', async () => {
    const result = await useCase.execute(
      { ...october, storeId: 'loja-centro', search: '   ' },
      { page: 1, pageSize: 10 },
    );
    expect(result.total).toBe(2);
  });

  it('dá 404 pra loja que não existe', async () => {
    await expect(
      useCase.execute({ ...october, storeId: 'loja-fantasma' }, { page: 1, pageSize: 10 }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});
