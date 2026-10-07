import { randomUUID } from 'node:crypto';
import type {
  ConnectionRepository,
  Pagination,
  StoreVisitorRow,
  StoreVisitorsFilter,
  StoreWithMetrics,
  VisitsFilter,
  VisitsSummary,
} from '../../src/connections/application/ports/connection.repository.js';
import type { MetricsPeriod } from '../../src/connections/application/period.js';
import { WifiConnection } from '../../src/connections/domain/wifi-connection.js';

type Store = { id: string; name: string; city: string };

export class InMemoryConnectionRepository implements ConnectionRepository {
  readonly items = new Map<string, WifiConnection>();
  // cpf -> id do visitante, igual a tabela visitors faz no banco
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
    // mesma ordem do SQL: mais visitadas primeiro, empate pelo nome
    return result.sort((a, b) => b.totalVisits - a.totalVisits || a.name.localeCompare(b.name));
  }

  async getVisitsSummary({ from, to, storeId }: VisitsFilter): Promise<VisitsSummary> {
    const inPeriod = this.inPeriod({ from, to }).filter(
      (c) => storeId === undefined || c.storeId === storeId,
    );
    return {
      totalVisits: inPeriod.length,
      uniqueVisitors: new Set(inPeriod.map((c) => c.visitor.cpf.digits)).size,
    };
  }

  async listStoreVisitors(
    { storeId, search, ...period }: StoreVisitorsFilter,
    { page, pageSize }: Pagination,
  ): Promise<{ items: StoreVisitorRow[]; total: number }> {
    const byVisitor = new Map<string, WifiConnection[]>();
    for (const c of this.inPeriod(period).filter((c) => c.storeId === storeId)) {
      const list = byVisitor.get(c.visitor.cpf.digits) ?? [];
      list.push(c);
      byVisitor.set(c.visitor.cpf.digits, list);
    }

    const term = search?.toLowerCase();
    const rows: StoreVisitorRow[] = [...byVisitor.entries()].map(([cpf, connections]) => {
      const last = connections.reduce((a, b) => (a.connectedAt > b.connectedAt ? a : b));
      return {
        visitorId: this.visitorIdOf(cpf),
        name: last.visitor.name,
        cpf,
        email: last.visitor.email,
        visits: connections.length,
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

  private visitorIdOf(cpf: string): string {
    if (!this.visitorIds.has(cpf)) this.visitorIds.set(cpf, randomUUID());
    return this.visitorIds.get(cpf)!;
  }

  private inPeriod({ from, to }: MetricsPeriod): WifiConnection[] {
    return [...this.items.values()].filter((c) => c.connectedAt >= from && c.connectedAt <= to);
  }
}
