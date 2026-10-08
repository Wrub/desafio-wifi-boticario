import {
  storesResponseSchema,
  storeVisitorsPageSchema,
  visitsDistributionSchema,
  visitsSummarySchema,
  type StoreSummary,
  type StoreVisitorsPage,
  type StoreVisitorsQueryInput,
  type VisitsDistribution,
  type VisitsQuery,
  type VisitsSummary,
} from '@wifi/contracts';
import { periodParams, requestJson, type Period } from './http';

export interface DashboardApi {
  getVisitsSummary(query: VisitsQuery, signal?: AbortSignal): Promise<VisitsSummary>;
  getVisitsDistribution(query: VisitsQuery, signal?: AbortSignal): Promise<VisitsDistribution>;
  listStores(period: Period, signal?: AbortSignal): Promise<StoreSummary[]>;
  listStoreVisitors(
    storeId: string,
    query: StoreVisitorsQueryInput & Period,
    signal?: AbortSignal,
  ): Promise<StoreVisitorsPage>;
}

export function createHttpDashboardApi(baseUrl: string): DashboardApi {
  return {
    getVisitsSummary(query, signal) {
      const params = periodParams(query);
      if (query.storeId) params.set('storeId', query.storeId);
      return requestJson(`${baseUrl}/metrics/visits?${params}`, visitsSummarySchema, signal);
    },

    getVisitsDistribution(query, signal) {
      const params = periodParams(query);
      if (query.storeId) params.set('storeId', query.storeId);
      return requestJson(
        `${baseUrl}/metrics/visits/distribution?${params}`,
        visitsDistributionSchema,
        signal,
      );
    },

    listStores(period, signal) {
      return requestJson(`${baseUrl}/stores?${periodParams(period)}`, storesResponseSchema, signal);
    },

    listStoreVisitors(storeId, query, signal) {
      const params = periodParams(query);
      if (query.page) params.set('page', String(query.page));
      if (query.pageSize) params.set('pageSize', String(query.pageSize));
      if (query.search?.trim()) params.set('search', query.search.trim());
      return requestJson(
        `${baseUrl}/stores/${encodeURIComponent(storeId)}/visitors?${params}`,
        storeVisitorsPageSchema,
        signal,
      );
    },
  };
}
