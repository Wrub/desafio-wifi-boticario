import { beforeEach, describe, expect, it } from 'vitest';
import { connection } from '../../../../test/fakes/builders.js';
import { InMemoryConnectionRepository } from '../../../../test/fakes/in-memory-connection.repository.js';
import { DomainError } from '../../domain/domain.error.js';
import { GetVisitsDistribution } from './get-visits-distribution.js';

const lastYear = { from: new Date('2025-10-08T00:00:00Z'), to: new Date('2026-10-08T00:00:00Z') };

describe('GetVisitsDistribution', () => {
  let repository: InMemoryConnectionRepository;
  let useCase: GetVisitsDistribution;

  beforeEach(() => {
    repository = new InMemoryConnectionRepository();
    useCase = new GetVisitsDistribution(repository);
  });

  it('devolve todas as chaves, com 0 onde não teve visita', async () => {
    const result = await useCase.execute(lastYear);

    expect(result.byWeekday).toHaveLength(7);
    expect(result.byHour).toHaveLength(24);
    expect(result.bySeason.map((s) => s.season)).toEqual([
      'verao',
      'outono',
      'inverno',
      'primavera',
    ]);
    expect(result.byHour.every((h) => h.visits === 0)).toBe(true);
  });

  it('conta dia da semana e hora no horário de Brasília, não em UTC', async () => {
    // domingo 01:30 em UTC = sábado 22:30 em Brasília
    await repository.save(connection({ id: '1', connectedAt: new Date('2026-10-04T01:30:00Z') }));

    const result = await useCase.execute(lastYear);

    expect(result.byWeekday[6]).toEqual({ weekday: 6, visits: 1 });
    expect(result.byHour[22]).toEqual({ hour: 22, visits: 1 });
  });

  it('agrupa os meses nas estações do hemisfério sul', async () => {
    const dates = ['2025-12-20', '2026-01-15', '2026-02-10', '2026-07-01', '2026-10-01'];
    for (const [i, day] of dates.entries()) {
      await repository.save(
        connection({ id: String(i), connectedAt: new Date(`${day}T15:00:00Z`) }),
      );
    }

    const { bySeason } = await useCase.execute(lastYear);

    expect(bySeason).toEqual([
      { season: 'verao', visits: 3 },
      { season: 'outono', visits: 0 },
      { season: 'inverno', visits: 1 },
      { season: 'primavera', visits: 1 },
    ]);
  });

  it('filtra por loja', async () => {
    await repository.save(connection({ id: '1', connectedAt: new Date('2026-10-02T15:00:00Z') }));
    await repository.save(
      connection({ id: '2', storeId: 'loja-batel', connectedAt: new Date('2026-10-02T15:00:00Z') }),
    );

    const result = await useCase.execute({ ...lastYear, storeId: 'loja-batel' });

    expect(result.byHour[12].visits).toBe(1);
  });

  it('recusa período maior que um ano', async () => {
    await expect(
      useCase.execute({ from: new Date('2024-01-01'), to: new Date('2026-01-01') }),
    ).rejects.toBeInstanceOf(DomainError);
  });
});
