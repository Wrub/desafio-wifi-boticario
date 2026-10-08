import { describe, expect, it } from 'vitest';
import { WifiConnection } from '../../../domain/wifi-connection.js';
import { DEMO_STORES, generateDemoConnections } from './demo-data.js';

const now = new Date('2026-10-07T15:00:00Z');

describe('generateDemoConnections', () => {
  const connections = generateDemoConnections(300, { now });

  it('gera conexões que passam nas regras do domínio', () => {
    expect(() => connections.forEach((props) => WifiConnection.create(props, now))).not.toThrow();
  });

  it('só usa lojas que existem no seed', () => {
    const storeIds = new Set(DEMO_STORES.map((s) => s.id));
    expect(connections.every((c) => storeIds.has(c.storeId))).toBe(true);
  });

  it('tem cliente que volta (menos pessoas do que conexões)', () => {
    const people = new Set(connections.map((c) => c.visitor.phone));
    expect(people.size).toBeLessThan(connections.length);
  });

  it('parte das pessoas não informa CPF', () => {
    const withoutCpf = connections.filter((c) => !c.visitor.cpf);
    expect(withoutCpf.length).toBeGreaterThan(0);
    expect(withoutCpf.length).toBeLessThan(connections.length);
  });

  it('gera sempre os mesmos dados (semente fixa)', () => {
    const again = generateDemoConnections(300, { now });
    expect(again.map((c) => c.id)).toEqual(connections.map((c) => c.id));
  });

  it('espalha as conexões pelo último ano, dentro do limite de 366 dias da API', () => {
    const daysAgo = connections.map((c) => (now.getTime() - c.connectedAt.getTime()) / 86_400_000);
    expect(Math.max(...daysAgo)).toBeGreaterThan(300);
    expect(Math.max(...daysAgo)).toBeLessThan(366);
    expect(Math.min(...daysAgo)).toBeGreaterThanOrEqual(0);
  });

  describe('sazonalidade', () => {
    const many = generateDemoConnections(3000, { now });
    const count = (pick: (date: Date) => boolean) => many.filter((c) => pick(c.connectedAt)).length;

    it('tem mais visitas no verão (dez a fev) do que no inverno (jun a ago)', () => {
      const summer = count((d) => [11, 0, 1].includes(d.getMonth()));
      const winter = count((d) => [5, 6, 7].includes(d.getMonth()));
      expect(summer).toBeGreaterThan(winter);
    });

    it('tem mais visitas no sábado do que na segunda', () => {
      expect(count((d) => d.getDay() === 6)).toBeGreaterThan(count((d) => d.getDay() === 1));
    });

    it('tem mais visitas em dezembro (Natal) do que em março', () => {
      expect(count((d) => d.getMonth() === 11)).toBeGreaterThan(count((d) => d.getMonth() === 2));
    });
  });

  it('não gera ids repetidos', () => {
    expect(new Set(connections.map((c) => c.id)).size).toBe(connections.length);
  });
});
