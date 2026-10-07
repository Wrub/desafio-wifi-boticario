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
  cpf: string;
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

  listStoreVisitors(
    filter: StoreVisitorsFilter,
    pagination: Pagination,
  ): Promise<{ items: StoreVisitorRow[]; total: number }>;
}
