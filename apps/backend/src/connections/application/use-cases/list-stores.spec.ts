import { describe, expect, it } from 'vitest';
import { connection } from '../../../../test/fakes/builders.js';
import { InMemoryConnectionRepository } from '../../../../test/fakes/in-memory-connection.repository.js';
import { ListStores } from './list-stores.js';

const october = { from: new Date('2026-10-01T00:00:00Z'), to: new Date('2026-10-07T23:59:59Z') };

describe('ListStores', () => {
  it('lista todas as lojas, com mais acessos primeiro, inclusive as sem acesso', async () => {
    const repository = new InMemoryConnectionRepository([
      { id: 'loja-centro', name: 'Centro', city: 'Curitiba' },
      { id: 'loja-batel', name: 'Batel', city: 'Curitiba' },
    ]);
    await repository.save(connection({ id: '1', storeId: 'loja-batel' }));
    await repository.save(connection({ id: '2', storeId: 'loja-batel' }));

    const result = await new ListStores(repository).execute(october);

    expect(result.map((s) => [s.id, s.totalVisits, s.uniqueVisitors])).toEqual([
      ['loja-batel', 2, 1],
      ['loja-centro', 0, 0],
    ]);
  });
});
