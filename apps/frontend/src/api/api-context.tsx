import { createContext, useContext, type ReactNode } from 'react';
import type { DashboardApi } from './dashboard-api';

const ApiContext = createContext<DashboardApi | null>(null);

export function ApiProvider({ api, children }: { api: DashboardApi; children: ReactNode }) {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useDashboardApi(): DashboardApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useDashboardApi precisa estar dentro do <ApiProvider>');
  return api;
}
