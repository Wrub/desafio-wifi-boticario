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
    const people = new Set(connections.map((c) => c.visitor.cpf));
    expect(people.size).toBeLessThan(connections.length);
  });

  it('gera sempre os mesmos dados (semente fixa)', () => {
    const again = generateDemoConnections(300, { now });
    expect(again.map((c) => c.id)).toEqual(connections.map((c) => c.id));
  });

  it('não gera ids repetidos', () => {
    expect(new Set(connections.map((c) => c.id)).size).toBe(connections.length);
  });
});
