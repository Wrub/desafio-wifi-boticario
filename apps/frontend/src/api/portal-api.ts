import {
  registerConnectionResponseSchema,
  storesResponseSchema,
  type RegisterConnectionRequest,
  type RegisterConnectionResponse,
  type StoreSummary,
} from '@wifi/contracts';
import { periodParams, requestJson, type Period } from './http';

export interface PortalApi {
  listStores(period: Period, signal?: AbortSignal): Promise<StoreSummary[]>;
  registerConnection(body: RegisterConnectionRequest): Promise<RegisterConnectionResponse>;
}

export function createHttpPortalApi(baseUrl: string): PortalApi {
  return {
    listStores(period, signal) {
      return requestJson(`${baseUrl}/stores?${periodParams(period)}`, storesResponseSchema, signal);
    },

    registerConnection(body) {
      return requestJson(`${baseUrl}/connections`, registerConnectionResponseSchema, undefined, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    },
  };
}
