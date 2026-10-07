import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StoreSummary, StoreVisitorsPage } from '@wifi/contracts';
import { describe, expect, it, vi } from 'vitest';
import { ApiProvider } from '../api/api-context';
import { ApiRequestError, type DashboardApi } from '../api/dashboard-api';
import { DashboardPage } from './DashboardPage';

const stores: StoreSummary[] = [
  {
    id: 'loja-centro',
    name: 'Loja Centro',
    city: 'Curitiba',
    totalVisits: 120,
    uniqueVisitors: 40,
  },
  {
    id: 'loja-shopping',
    name: 'Shopping Norte',
    city: 'São Paulo',
    totalVisits: 80,
    uniqueVisitors: 30,
  },
  { id: 'loja-orla', name: 'Orla', city: 'Florianópolis', totalVisits: 0, uniqueVisitors: 0 },
];

const visitorsPage: StoreVisitorsPage = {
  page: 1,
  pageSize: 10,
  total: 1,
  items: [
    {
      id: '6f1c2b8e-3d4a-4b5c-9e7f-1a2b3c4d5e6f',
      name: 'Maria Souza',
      maskedCpf: '***.982.247-**',
      email: 'maria@email.com',
      visits: 3,
      lastConnectedAt: '2026-10-05T18:30:00.000Z',
      lastDevice: { macAddress: 'AA:BB:CC:DD:EE:FF', type: 'smartphone', os: 'iOS 18' },
    },
  ],
};

function fakeApi(overrides: Partial<DashboardApi> = {}): DashboardApi {
  return {
    getVisitsSummary: vi.fn().mockResolvedValue({ totalVisits: 500, uniqueVisitors: 210 }),
    listStores: vi.fn().mockResolvedValue(stores),
    listStoreVisitors: vi.fn().mockResolvedValue(visitorsPage),
    ...overrides,
  };
}

function renderPage(api: DashboardApi) {
  return render(
    <ApiProvider api={api}>
      <DashboardPage />
    </ApiProvider>,
  );
}

// abre a página já com uma loja na URL, como se a pessoa tivesse entrado pelo link dela
function renderStorePage(api: DashboardApi, storeId = 'loja-centro') {
  window.history.replaceState(null, '', `/lojas/${storeId}`);
  return renderPage(api);
}

describe('DashboardPage: grade de lojas', () => {
  it('começa limpa: total da rede e a grade de lojas, sem nenhuma loja aberta', async () => {
    renderPage(fakeApi());

    expect(await screen.findByText('500')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Loja Centro/ })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('filtra a grade pelo nome ou cidade, sem ligar pra acento', async () => {
    renderPage(fakeApi());
    await screen.findByRole('button', { name: /Loja Centro/ });

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar loja' }), 'sao paulo');

    expect(screen.getAllByRole('listitem')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /Shopping Norte/ })).toBeInTheDocument();

    await userEvent.clear(screen.getByRole('searchbox', { name: 'Buscar loja' }));
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar loja' }), 'xyz');
    expect(screen.getByText('Nenhuma loja encontrada.')).toBeInTheDocument();
  });

  it('ao escolher uma loja mostra os detalhes, as abas e atualiza a URL', async () => {
    renderPage(fakeApi());

    await userEvent.click(await screen.findByRole('button', { name: /Shopping Norte/ }));

    const panel = screen.getByRole('tabpanel', { name: 'Shopping Norte' });
    const perPersonCard = within(panel)
      .getByRole('heading', { name: 'Visitas por pessoa' })
      .closest('article')!;
    expect(perPersonCard).toHaveTextContent('2,7'); // 80 / 30
    expect(await within(panel).findByText('Maria Souza')).toBeInTheDocument();
    expect(within(panel).getByText('***.982.247-**')).toBeInTheDocument();
    expect(within(panel).getByText('Celular')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    expect(window.location.pathname).toBe('/lojas/loja-shopping');
  });

  it('"Todas as lojas" tira a seleção e volta pra grade', async () => {
    renderStorePage(fakeApi());
    await screen.findByRole('tabpanel', { name: 'Loja Centro' });

    await userEvent.click(screen.getByRole('button', { name: /Todas as lojas/ }));

    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(window.location.pathname).toBe('/');
  });

  it('mostra erro e tenta de novo quando o usuário pede', async () => {
    const listStores = vi
      .fn()
      .mockRejectedValueOnce(new ApiRequestError('Não foi possível conectar ao servidor.'))
      .mockResolvedValueOnce(stores);
    renderPage(fakeApi({ listStores }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível conectar ao servidor.',
    );

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByRole('button', { name: /Loja Centro/ })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('busca de novo com outro intervalo quando troca o período', async () => {
    const api = fakeApi();
    renderPage(api);
    await screen.findByRole('button', { name: /Loja Centro/ });

    await userEvent.click(screen.getByRole('button', { name: '30 dias' }));

    const lastPeriod = vi.mocked(api.listStores).mock.lastCall?.[0];
    const days = (lastPeriod!.to.getTime() - lastPeriod!.from.getTime()) / 86_400_000;
    expect(days).toBeGreaterThan(28);
  });
});

describe('DashboardPage: loja selecionada', () => {
  it('abre direto a loja do link /lojas/<id>', async () => {
    const api = fakeApi();
    renderStorePage(api, 'loja-shopping');

    expect(await screen.findByRole('tabpanel', { name: 'Shopping Norte' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Shopping Norte/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(api.listStoreVisitors).toHaveBeenCalledWith(
      'loja-shopping',
      expect.objectContaining({ page: 1, pageSize: 10 }),
      expect.any(AbortSignal),
    );
  });

  it('trocar de aba troca a loja e a URL', async () => {
    renderStorePage(fakeApi());

    await userEvent.click(await screen.findByRole('tab', { name: /Orla/ }));

    expect(screen.getByRole('tabpanel', { name: 'Orla' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/lojas/loja-orla');
  });

  it('a aba já selecionada fica com cursor de bloqueado e clicar nela não muda nada', async () => {
    renderStorePage(fakeApi());
    const selected = await screen.findByRole('tab', { name: /Loja Centro/ });
    const historyLength = window.history.length;

    await userEvent.click(selected);

    expect(selected).toHaveClass('cursor-not-allowed');
    expect(screen.getByRole('tab', { name: /Orla/ })).not.toHaveClass('cursor-not-allowed');
    expect(window.history.length).toBe(historyLength);
  });

  it('dá pra trocar de loja com as setas do teclado', async () => {
    renderStorePage(fakeApi());
    const first = await screen.findByRole('tab', { name: /Loja Centro/ });

    first.focus();
    await userEvent.keyboard('{ArrowDown}');

    const next = screen.getByRole('tab', { name: /Shopping Norte/ });
    expect(next).toHaveAttribute('aria-selected', 'true');
    expect(next).toHaveFocus();
  });

  it('o voltar do navegador volta pra grade', async () => {
    renderPage(fakeApi());
    await userEvent.click(await screen.findByRole('button', { name: /Orla/ }));
    expect(screen.getByRole('tabpanel', { name: 'Orla' })).toBeInTheDocument();

    // simula o botão voltar
    act(() => {
      window.history.replaceState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });

    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('mostra aviso quando a loja do link não existe', async () => {
    renderStorePage(fakeApi(), 'loja-fantasma');

    expect(await screen.findByText(/não\s+encontrada/)).toHaveTextContent('loja-fantasma');
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Ver todas as lojas' }));

    expect(window.location.pathname).toBe('/');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('link com % quebrado mostra "loja não encontrada" em vez de derrubar a página', async () => {
    window.history.replaceState(null, '', '/lojas/%E0%A4%A');
    renderPage(fakeApi());

    expect(await screen.findByText(/não\s+encontrada/)).toHaveTextContent('%E0%A4%A');
    expect(screen.getByRole('button', { name: 'Ver todas as lojas' })).toBeInTheDocument();
  });

  it('busca visitantes na API e volta pra primeira página', async () => {
    const api = fakeApi();
    renderStorePage(api);
    await screen.findByText('Maria Souza');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar visitante' }), 'maria');

    // espera o debounce e confere a request com a busca
    await vi.waitFor(() =>
      expect(api.listStoreVisitors).toHaveBeenLastCalledWith(
        'loja-centro',
        expect.objectContaining({ search: 'maria', page: 1 }),
        expect.any(AbortSignal),
      ),
    );
  });

  it('avisa quando a busca de visitante não acha ninguém', async () => {
    const listStoreVisitors = vi
      .fn()
      .mockResolvedValueOnce(visitorsPage)
      .mockResolvedValue({ ...visitorsPage, items: [], total: 0 });
    renderStorePage(fakeApi({ listStoreVisitors }));
    await screen.findByText('Maria Souza');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar visitante' }), 'zzz');

    expect(await screen.findByText('Nenhum visitante encontrado para "zzz".')).toBeInTheDocument();
  });
});
