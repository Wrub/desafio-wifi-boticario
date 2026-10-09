import { randomUUID } from 'node:crypto';
import {
  STORE_TIME_ZONE,
  type ConnectionRepository,
  type Pagination,
  type StoreVisitorRow,
  type StoreVisitorsFilter,
  type StoreWithMetrics,
  type VisitsCounts,
  type VisitsFilter,
  type VisitsSummary,
} from '../../src/connections/application/ports/connection.repository.js';
import type { MetricsPeriod } from '../../src/connections/application/period.js';
import { WifiConnection } from '../../src/connections/domain/wifi-connection.js';

type Store = { id: string; name: string; city: string };

// mesmo papel do AT TIME ZONE do SQL: dia da semana, hora e mês no horário da loja
const storeClock = new Intl.DateTimeFormat('en-US', {
  timeZone: STORE_TIME_ZONE,
  weekday: 'short',
  hour: 'numeric',
  hourCycle: 'h23',
  month: 'numeric',
});
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export class InMemoryConnectionRepository implements ConnectionRepository {
  readonly items = new Map<string, WifiConnection>();
  // celular -> id do visitante, igual a tabela visitors faz no banco
  private readonly visitorIds = new Map<string, string>();

  constructor(private readonly stores: Store[] = []) {}

  async save(connection: WifiConnection): Promise<void> {
    if (!this.items.has(connection.id)) {
      this.items.set(connection.id, connection);
    }
  }

  async storeExists(storeId: string): Promise<boolean> {
    return this.stores.some((s) => s.id === storeId);
  }

  async listStoresWithMetrics(period: MetricsPeriod): Promise<StoreWithMetrics[]> {
    const result = await Promise.all(
      this.stores.map(async (store) => ({
        ...store,
        ...(await this.getVisitsSummary({ ...period, storeId: store.id })),
      })),
    );
    // mesma ordem do SQL: com mais acessos primeiro, empate pelo nome
    return result.sort((a, b) => b.totalVisits - a.totalVisits || a.name.localeCompare(b.name));
  }

  async getVisitsSummary({ from, to, storeId }: VisitsFilter): Promise<VisitsSummary> {
    const inPeriod = this.inPeriod({ from, to }).filter(
      (c) => storeId === undefined || c.storeId === storeId,
    );
    return {
      totalVisits: inPeriod.length,
      uniqueVisitors: new Set(inPeriod.map((c) => c.visitor.phone.e164)).size,
    };
  }

  async countVisitsByTime({ from, to, storeId }: VisitsFilter): Promise<VisitsCounts> {
    const counts: VisitsCounts = { byWeekday: new Map(), byHour: new Map(), byMonth: new Map() };
    const add = (map: Map<number, number>, key: number) => map.set(key, (map.get(key) ?? 0) + 1);

    for (const c of this.inPeriod({ from, to })) {
      if (storeId !== undefined && c.storeId !== storeId) continue;
      const parts = Object.fromEntries(
        storeClock.formatToParts(c.connectedAt).map((p) => [p.type, p.value]),
      );
      add(counts.byWeekday, WEEKDAYS.indexOf(parts.weekday));
      add(counts.byHour, Number(parts.hour));
      add(counts.byMonth, Number(parts.month));
    }
    return counts;
  }

  async listStoreVisitors(
    { storeId, search, ...period }: StoreVisitorsFilter,
    { page, pageSize }: Pagination,
  ): Promise<{ items: StoreVisitorRow[]; total: number }> {
    const byVisitor = new Map<string, WifiConnection[]>();
    for (const c of this.inPeriod(period).filter((c) => c.storeId === storeId)) {
      const list = byVisitor.get(c.visitor.phone.e164) ?? [];
      list.push(c);
      byVisitor.set(c.visitor.phone.e164, list);
    }

    const term = search?.toLowerCase();
    const rows: StoreVisitorRow[] = [...byVisitor.entries()].map(([phone, connections]) => {
      const last = connections.reduce((a, b) => (a.connectedAt > b.connectedAt ? a : b));
      const withCpf = connections.filter((c) => c.visitor.cpf);
      const lastCpf = withCpf.reduce<WifiConnection | undefined>(
        (a, b) => (a && a.connectedAt > b.connectedAt ? a : b),
        undefined,
      );
      return {
        visitorId: this.visitorIdOf(phone),
        name: last.visitor.name,
        phone,
        cpf: lastCpf?.visitor.cpf?.digits ?? null,
        email: last.visitor.email,
        visits: connections.length,
        visitTimes: connections.map((c) => c.connectedAt).sort((a, b) => a.getTime() - b.getTime()),
        lastConnectedAt: last.connectedAt,
        lastDevice: {
          macAddress: last.device.macAddress,
          type: last.device.type,
          os: last.device.os,
        },
      };
    });
    const matching = term
      ? rows.filter((r) => r.name.toLowerCase().includes(term) || r.email.includes(term))
      : rows;
    matching.sort((a, b) => b.lastConnectedAt.getTime() - a.lastConnectedAt.getTime());

    const start = (page - 1) * pageSize;
    return { items: matching.slice(start, start + pageSize), total: matching.length };
  }

  private visitorIdOf(phone: string): string {
    if (!this.visitorIds.has(phone)) this.visitorIds.set(phone, randomUUID());
    return this.visitorIds.get(phone)!;
  }

  private inPeriod({ from, to }: MetricsPeriod): WifiConnection[] {
    return [...this.items.values()].filter((c) => c.connectedAt >= from && c.connectedAt <= to);
  }
}
