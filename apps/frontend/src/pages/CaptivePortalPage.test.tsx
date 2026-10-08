import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { StoreSummary } from '@wifi/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PortalApiProvider } from '../api/api-context';
import { ApiRequestError } from '../api/http';
import type { PortalApi } from '../api/portal-api';
import { simulatedDevice } from '../utils/device';
import { CaptivePortalPage } from './CaptivePortalPage';

const stores: StoreSummary[] = [
  { id: 'loja-centro', name: 'Loja Centro', city: 'Curitiba', totalVisits: 0, uniqueVisitors: 0 },
  { id: 'loja-orla', name: 'Orla', city: 'Florianópolis', totalVisits: 0, uniqueVisitors: 0 },
];

function fakeApi(overrides: Partial<PortalApi> = {}): PortalApi {
  return {
    listStores: vi.fn().mockResolvedValue(stores),
    registerConnection: vi.fn().mockResolvedValue({ id: 'f3a1c2b8-3d4a-4b5c-9e7f-1a2b3c4d5e6f' }),
    ...overrides,
  };
}

function renderPortal(api: PortalApi, path = '/portal/loja-orla') {
  window.history.replaceState(null, '', path);
  render(
    <PortalApiProvider api={api}>
      <CaptivePortalPage />
    </PortalApiProvider>,
  );
}

async function fillRequired() {
  await userEvent.type(await screen.findByLabelText('Nome'), 'Maria Souza');
  await userEvent.type(screen.getByLabelText('Celular'), '(41) 99999-8888');
  await userEvent.type(screen.getByLabelText('E-mail'), 'maria@email.com');
  await userEvent.click(screen.getByRole('checkbox'));
}

describe('CaptivePortalPage', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('abre na loja do link', async () => {
    renderPortal(fakeApi());
    expect(await screen.findByRole('heading', { name: 'Orla' })).toBeInTheDocument();
  });

  it('conecta sem CPF e convida pro clube de vantagens', async () => {
    const api = fakeApi();
    renderPortal(api);
    await fillRequired();

    await userEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    expect(api.registerConnection).toHaveBeenCalledWith(
      expect.objectContaining({
        storeId: 'loja-orla',
        visitor: {
          name: 'Maria Souza',
          phone: '(41) 99999-8888',
          email: 'maria@email.com',
          cpf: undefined,
        },
      }),
    );
    expect(await screen.findByText(/Pronto, Maria!/)).toBeInTheDocument();
    expect(screen.getByText(/Na próxima visita, informe seu CPF/)).toBeInTheDocument();
  });

  it('com CPF, vincula ao clube de vantagens', async () => {
    const api = fakeApi();
    renderPortal(api);
    await fillRequired();
    await userEvent.type(screen.getByLabelText('CPF'), '529.982.247-25');

    await userEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    expect(vi.mocked(api.registerConnection).mock.lastCall?.[0].visitor.cpf).toBe('529.982.247-25');
    expect(await screen.findByText(/CPF foi vinculado ao clube/)).toBeInTheDocument();
  });

  it('formata celular e CPF enquanto digita', async () => {
    const api = fakeApi();
    renderPortal(api);
    await userEvent.type(await screen.findByLabelText('Nome'), 'Maria Souza');
    await userEvent.type(screen.getByLabelText('Celular'), '41999998888');
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@email.com');
    await userEvent.type(screen.getByLabelText('CPF'), '52998224725');
    await userEvent.click(screen.getByRole('checkbox'));

    expect(screen.getByLabelText('Celular')).toHaveValue('(41) 99999-8888');
    expect(screen.getByLabelText('CPF')).toHaveValue('529.982.247-25');

    await userEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    expect(vi.mocked(api.registerConnection).mock.lastCall?.[0].visitor).toMatchObject({
      phone: '(41) 99999-8888',
      cpf: '529.982.247-25',
    });
  });

  it('valida antes de enviar: celular e termos', async () => {
    const api = fakeApi();
    renderPortal(api);
    await userEvent.type(await screen.findByLabelText('Nome'), 'Maria Souza');
    await userEvent.type(screen.getByLabelText('Celular'), '(41) 3333-4444');
    await userEvent.type(screen.getByLabelText('E-mail'), 'maria@email.com');

    await userEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    expect(screen.getByLabelText('Celular')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/use DDD \+ 9 dígitos/)).toBeInTheDocument();
    expect(screen.getByText('Aceite os termos de uso para continuar.')).toBeInTheDocument();
    expect(api.registerConnection).not.toHaveBeenCalled();
  });

  it('mostra no campo o erro de CPF que vem da API', async () => {
    const api = fakeApi({
      registerConnection: vi.fn().mockRejectedValue(new ApiRequestError('CPF inválido', 400)),
    });
    renderPortal(api);
    await fillRequired();
    await userEvent.type(screen.getByLabelText('CPF'), '123.456.789-00');

    await userEvent.click(screen.getByRole('button', { name: 'Conectar' }));

    expect(await screen.findByText('CPF inválido')).toBeInTheDocument();
    expect(screen.getByLabelText('CPF')).toHaveAttribute('aria-invalid', 'true');
  });
});

describe('simulatedDevice', () => {
  it('tira o tipo e o sistema do user agent', () => {
    const iphone = simulatedDevice(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Mobile',
    );
    expect(iphone).toMatchObject({ type: 'smartphone', os: 'iOS' });
    expect(iphone.macAddress).toMatch(/^([0-9A-F]{2}:){5}[0-9A-F]{2}$/);

    expect(simulatedDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toMatchObject({
      type: 'laptop',
      os: 'Windows',
    });
  });
});
