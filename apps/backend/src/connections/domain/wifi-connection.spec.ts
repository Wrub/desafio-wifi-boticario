import { describe, expect, it } from 'vitest';
import { connectionProps } from '../../../test/fakes/builders.js';
import { InvalidConnectionError } from './domain.error.js';
import { WifiConnection } from './wifi-connection.js';

const now = new Date('2026-10-07T12:00:00Z');

describe('WifiConnection', () => {
  it('normaliza o MAC (hífen e minúscula viram AA:BB:...)', () => {
    const connection = WifiConnection.create(
      connectionProps({
        device: { macAddress: 'aa-bb-cc-dd-ee-ff', type: 'smartphone' },
      }),
      now,
    );
    expect(connection.device.macAddress).toBe('AA:BB:CC:DD:EE:FF');
    expect(connection.device.os).toBeNull();
  });

  it('normaliza o e-mail do visitante', () => {
    const connection = WifiConnection.create(
      connectionProps({
        visitor: {
          name: ' Maria ',
          phone: '(41) 99999-8888',
          cpf: '529.982.247-25',
          email: 'Maria@Email.com ',
        },
      }),
      now,
    );
    expect(connection.visitor.email).toBe('maria@email.com');
    expect(connection.visitor.name).toBe('Maria');
  });

  it('recusa MAC inválido', () => {
    expect(() =>
      WifiConnection.create(
        connectionProps({ device: { macAddress: '12345', type: 'smartphone' } }),
        now,
      ),
    ).toThrow(InvalidConnectionError);
  });

  it('recusa tipo de aparelho desconhecido', () => {
    expect(() =>
      WifiConnection.create(
        connectionProps({ device: { macAddress: 'aa:bb:cc:dd:ee:ff', type: 'geladeira' } }),
        now,
      ),
    ).toThrow('tipo de aparelho inválido');
  });

  it('recusa CPF inválido', () => {
    expect(() =>
      WifiConnection.create(
        connectionProps({
          visitor: { name: 'Maria', phone: '41999998888', cpf: '12345678900', email: 'm@m.com' },
        }),
        now,
      ),
    ).toThrow('CPF inválido');
  });

  it('recusa celular inválido', () => {
    expect(() =>
      WifiConnection.create(
        connectionProps({ visitor: { name: 'Maria', phone: '4133334444', email: 'm@m.com' } }),
        now,
      ),
    ).toThrow('celular inválido');
  });

  it('aceita visitante sem CPF e guarda o celular normalizado', () => {
    const connection = WifiConnection.create(
      connectionProps({ visitor: { name: 'Maria', phone: '(41) 99999-8888', email: 'm@m.com' } }),
      now,
    );
    expect(connection.visitor.cpf).toBeNull();
    expect(connection.visitor.phone.e164).toBe('+5541999998888');
  });

  it('recusa conexão no futuro', () => {
    expect(() =>
      WifiConnection.create(
        connectionProps({ connectedAt: new Date('2026-10-07T13:00:00Z') }),
        now,
      ),
    ).toThrow('connectedAt não pode estar no futuro');
  });

  it('tolera relógio um pouco adiantado', () => {
    expect(() =>
      WifiConnection.create(
        connectionProps({ connectedAt: new Date(now.getTime() + 30_000) }),
        now,
      ),
    ).not.toThrow();
  });
});
