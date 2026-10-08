import type { DeviceType } from '../../domain/device.js';
import { WifiConnection } from '../../domain/wifi-connection.js';
import type { MetricsPeriod } from '../period.js';

export const CONNECTION_REPOSITORY = Symbol('CONNECTION_REPOSITORY');

export interface VisitsFilter extends MetricsPeriod {
  storeId?: string;
}

export interface VisitsSummary {
  totalVisits: number;
  uniqueVisitors: number;
}

export interface StoreWithMetrics {
  id: string;
  name: string;
  city: string;
  totalVisits: number;
  uniqueVisitors: number;
}

// Todas as lojas estão no horário de Brasília (sem horário de verão desde 2019).
// Dia da semana, hora e mês são contados nesse fuso, não em UTC.
export const STORE_TIME_ZONE = 'America/Sao_Paulo';

// Contagem de visitas por chave: dia da semana (0 = domingo), hora (0 a 23) e mês (1 a 12).
// Chave sem visita não aparece no Map.
export interface VisitsCounts {
  byWeekday: Map<number, number>;
  byHour: Map<number, number>;
  byMonth: Map<number, number>;
}

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface StoreVisitorsFilter extends MetricsPeriod {
  storeId: string;
  search?: string;
}

export interface StoreVisitorRow {
  visitorId: string;
  name: string;
  phone: string;
  cpf: string | null;
  email: string;
  visits: number;
  visitTimes: Date[];
  lastConnectedAt: Date;
  lastDevice: { macAddress: string; type: DeviceType; os: string | null };
}

export interface ConnectionRepository {
  save(connection: WifiConnection): Promise<void>;

  storeExists(storeId: string): Promise<boolean>;

  listStoresWithMetrics(period: MetricsPeriod): Promise<StoreWithMetrics[]>;

  getVisitsSummary(filter: VisitsFilter): Promise<VisitsSummary>;

  countVisitsByTime(filter: VisitsFilter): Promise<VisitsCounts>;

  listStoreVisitors(
    filter: StoreVisitorsFilter,
    pagination: Pagination,
  ): Promise<{ items: StoreVisitorRow[]; total: number }>;
}
