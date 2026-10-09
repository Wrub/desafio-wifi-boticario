import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { VisitsDistribution } from '@wifi/contracts';
import { describe, expect, it, vi } from 'vitest';
import { DashboardApiProvider } from '../api/api-context';
import type { DashboardApi } from '../api/dashboard-api';
import { ApiRequestError } from '../api/http';
import { VisitPatterns } from './VisitPatterns';

function distribution(
  weekdays: Record<number, number>,
  hours: Record<number, number>,
  seasons: Partial<Record<'verao' | 'outono' | 'inverno' | 'primavera', number>>,
  months: Record<number, number> = {},
): VisitsDistribution {
  return {
    byWeekday: Array.from({ length: 7 }, (_, weekday) => ({
      weekday,
      visits: weekdays[weekday] ?? 0,
    })),
    byHour: Array.from({ length: 24 }, (_, hour) => ({ hour, visits: hours[hour] ?? 0 })),
    byMonth: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, visits: months[i + 1] ?? 0 })),
    bySeason: (['verao', 'outono', 'inverno', 'primavera'] as const).map((season) => ({
      season,
      visits: seasons[season] ?? 0,
    })),
  };
}

function renderPatterns(
  getVisitsDistribution: DashboardApi['getVisitsDistribution'],
  storeId?: string,
) {
  const api: DashboardApi = {
    getVisitsSummary: vi.fn(),
    getVisitsDistribution,
    listStores: vi.fn(),
    listStoreVisitors: vi.fn(),
  };
  render(
    <DashboardApiProvider api={api}>
      <VisitPatterns title="Quando o Wi-Fi da loja é mais acessado" storeId={storeId} />
    </DashboardApiProvider>,
  );
  return api;
}

describe('VisitPatterns', () => {
  it('destaca o dia, o horário e a estação com mais visitas', async () => {
    renderPatterns(
      vi
        .fn()
        .mockResolvedValue(
          distribution({ 1: 10, 6: 40 }, { 10: 5, 18: 30, 21: 2 }, { verao: 50, inverno: 20 }),
        ),
    );

    const weekday = await screen.findByRole('article', { name: 'Dia da semana' });
    expect(within(weekday).getByText('Sábado', { selector: 'p' })).toBeInTheDocument();

    const hour = screen.getByRole('article', { name: 'Horário' });
    expect(within(hour).getByText('18h', { selector: 'p' })).toBeInTheDocument();

    const season = screen.getByRole('article', { name: 'Estação do ano' });
    expect(within(season).getByText('Verão', { selector: 'p' })).toBeInTheDocument();
  });

  it('destaca o mês com mais visitas e mostra os 12 meses com rótulo curto', async () => {
    renderPatterns(
      vi.fn().mockResolvedValue(distribution({ 6: 1 }, { 18: 1 }, { verao: 1 }, { 5: 30, 12: 45 })),
    );

    const month = await screen.findByRole('article', { name: 'Mês' });
    expect(within(month).getByText('Dezembro', { selector: 'p' })).toBeInTheDocument();
    expect(within(month).getAllByRole('listitem')).toHaveLength(12);
    expect(within(month).getByText('Dez')).toBeInTheDocument();
    expect(within(month).getByTitle('Maio: 30 acessos')).toBeInTheDocument();
  });

  it('mostra só as horas entre a primeira e a última com visita', async () => {
    renderPatterns(
      vi.fn().mockResolvedValue(distribution({ 6: 1 }, { 10: 5, 21: 2 }, { verao: 7 })),
    );

    const hour = await screen.findByRole('article', { name: 'Horário' });
    const labels = within(hour)
      .getAllByRole('listitem')
      .map((item) => item.getAttribute('title')?.split(':')[0]);
    expect(labels).toEqual([
      '10h',
      '11h',
      '12h',
      '13h',
      '14h',
      '15h',
      '16h',
      '17h',
      '18h',
      '19h',
      '20h',
      '21h',
    ]);
  });

  it('pede os dados da loja nos últimos 12 meses', async () => {
    const getVisitsDistribution = vi.fn().mockResolvedValue(distribution({}, {}, {}));
    renderPatterns(getVisitsDistribution, 'loja-orla');

    await screen.findByText('Sem acessos no período.');
    const query = getVisitsDistribution.mock.lastCall![0];
    expect(query.storeId).toBe('loja-orla');
    expect((query.to.getTime() - query.from.getTime()) / 86_400_000).toBeGreaterThan(364);
  });

  it('troca pra 30 dias e só oferece 30 dias e 12 meses', async () => {
    const getVisitsDistribution = vi.fn().mockResolvedValue(distribution({}, {}, {}));
    renderPatterns(getVisitsDistribution);
    await screen.findByText('Sem acessos no período.');

    const selector = screen.getByRole('group', { name: 'Período dos padrões de acesso' });
    expect(
      within(selector)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['30 dias', '12 meses']);

    await userEvent.click(within(selector).getByRole('button', { name: '30 dias' }));

    const query = getVisitsDistribution.mock.lastCall![0];
    expect((query.to.getTime() - query.from.getTime()) / 86_400_000).toBeLessThan(31);
    expect(
      screen.getByText('Conexões ao Wi-Fi nos últimos 30 dias em todas as lojas'),
    ).toBeInTheDocument();
  });

  it('mostra o erro e tenta de novo', async () => {
    const getVisitsDistribution = vi
      .fn()
      .mockRejectedValueOnce(new ApiRequestError('Não foi possível conectar ao servidor.'))
      .mockResolvedValue(distribution({ 5: 3 }, { 12: 3 }, { outono: 3 }));
    renderPatterns(getVisitsDistribution);

    await userEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }));

    const weekday = await screen.findByRole('article', { name: 'Dia da semana' });
    expect(within(weekday).getByText('Sexta', { selector: 'p' })).toBeInTheDocument();
  });
});
