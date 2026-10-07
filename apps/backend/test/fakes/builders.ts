import {
  WifiConnection,
  type WifiConnectionProps,
} from '../../src/connections/domain/wifi-connection.js';

// CPFs válidos (gerados) pra usar nos testes
export const CPF_MARIA = '52998224725';
export const CPF_JOAO = '11144477735';
export const CPF_ANA = '39053344705';

export const PHONE_MARIA = '+5541999998888';
export const PHONE_JOAO = '+5511988887777';
export const PHONE_ANA = '+5548977776666';

export function connectionProps(overrides: Partial<WifiConnectionProps> = {}): WifiConnectionProps {
  return {
    id: '6f1c2b8e-3d4a-4b5c-9e7f-1a2b3c4d5e6f',
    storeId: 'loja-centro',
    connectedAt: new Date('2026-10-02T10:00:00Z'),
    device: { macAddress: 'aa:bb:cc:dd:ee:ff', type: 'smartphone', os: 'Android 15' },
    visitor: { name: 'Maria Souza', phone: PHONE_MARIA, cpf: CPF_MARIA, email: 'maria@email.com' },
    ...overrides,
  };
}

export function connection(overrides: Partial<WifiConnectionProps> = {}): WifiConnection {
  return WifiConnection.create(connectionProps(overrides));
}
