import {
  apiErrorSchema,
  storesResponseSchema,
  storeVisitorsPageSchema,
  visitsSummarySchema,
  type ApiError,
  type StoreSummary,
  type StoreVisitorsPage,
  type StoreVisitorsQueryInput,
  type VisitsQuery,
  type VisitsSummary,
} from '@wifi/contracts';
import type { ZodType } from 'zod';

type Period = { from: Date; to: Date };

// Tudo que a tela precisa do backend. Os componentes dependem dessa interface
// e não do fetch, assim no teste eu passo um fake.
export interface DashboardApi {
  getVisitsSummary(query: VisitsQuery, signal?: AbortSignal): Promise<VisitsSummary>;
  listStores(period: Period, signal?: AbortSignal): Promise<StoreSummary[]>;
  listStoreVisitors(
    storeId: string,
    query: StoreVisitorsQueryInput & Period,
    signal?: AbortSignal,
  ): Promise<StoreVisitorsPage>;
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly issues?: ApiError['issues'],
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function requestJson<T>(url: string, schema: ZodType<T>, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiRequestError('Não foi possível conectar ao servidor.');
  }

  const body: unknown = await response.json().catch(() => undefined);

  if (!response.ok) {
    const apiError = apiErrorSchema.safeParse(body);
    throw new ApiRequestError(
      apiError.success ? apiError.data.message : `Erro inesperado (HTTP ${response.status}).`,
      response.status,
      apiError.success ? apiError.data.issues : undefined,
    );
  }

  // se o backend mudar o formato sem atualizar o contrato, quebra aqui e não lá na tela
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error('Resposta fora do contrato', parsed.error);
    throw new ApiRequestError('O servidor respondeu em um formato inesperado.');
  }
  return parsed.data;
}

function periodParams({ from, to }: Period): URLSearchParams {
  return new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
}

export function createHttpDashboardApi(baseUrl: string): DashboardApi {
  return {
    getVisitsSummary(query, signal) {
      const params = periodParams(query);
      if (query.storeId) params.set('storeId', query.storeId);
      return requestJson(`${baseUrl}/metrics/visits?${params}`, visitsSummarySchema, signal);
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
