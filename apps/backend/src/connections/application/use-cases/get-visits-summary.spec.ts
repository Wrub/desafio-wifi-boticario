import { beforeEach, describe, expect, it } from 'vitest';
import {
  connection,
  CPF_JOAO,
  CPF_MARIA,
  PHONE_JOAO,
  PHONE_MARIA,
} from '../../../../test/fakes/builders.js';
import { InMemoryConnectionRepository } from '../../../../test/fakes/in-memory-connection.repository.js';
import { DomainError } from '../../domain/domain.error.js';
import { GetVisitsSummary } from './get-visits-summary.js';

const maria = { name: 'Maria', phone: PHONE_MARIA, cpf: CPF_MARIA, email: 'maria@email.com' };
const joao = { name: 'João', phone: PHONE_JOAO, cpf: CPF_JOAO, email: 'joao@email.com' };
const october = { from: new Date('2026-10-01T00:00:00Z'), to: new Date('2026-10-07T23:59:59Z') };

describe('GetVisitsSummary', () => {
  let repository: InMemoryConnectionRepository;
  let useCase: GetVisitsSummary;

  beforeEach(async () => {
    repository = new InMemoryConnectionRepository();
    useCase = new GetVisitsSummary(repository);

    // Maria vem 2x (celular e notebook), João 1x, e uma visita fora do período
    await repository.save(
      connection({ id: '1', visitor: maria, connectedAt: new Date('2026-10-02T10:00:00Z') }),
    );
    await repository.save(
      connection({
        id: '2',
        visitor: maria,
        device: { macAddress: '11:22:33:44:55:66', type: 'laptop' },
        connectedAt: new Date('2026-10-03T15:00:00Z'),
      }),
    );
    await repository.save(
      connection({ id: '3', visitor: joao, connectedAt: new Date('2026-10-03T16:00:00Z') }),
    );
    await repository.save(
      connection({ id: '4', visitor: joao, connectedAt: new Date('2026-09-01T10:00:00Z') }),
    );
  });

  it('conta visitas e pessoas (não aparelhos) no período', async () => {
    expect(await useCase.execute(october)).toEqual({ totalVisits: 3, uniqueVisitors: 2 });
  });

  it('filtra por loja', async () => {
    await repository.save(
      connection({ id: '5', storeId: 'loja-batel', connectedAt: new Date('2026-10-04T10:00:00Z') }),
    );
    expect(await useCase.execute({ ...october, storeId: 'loja-batel' })).toEqual({
      totalVisits: 1,
      uniqueVisitors: 1,
    });
  });

  it('recusa período maior que um ano', async () => {
    await expect(
      useCase.execute({ from: new Date('2024-01-01'), to: new Date('2026-01-01') }),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
