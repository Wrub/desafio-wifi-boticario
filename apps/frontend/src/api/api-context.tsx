import { createContext, useContext, type ReactNode } from 'react';
import type { DashboardApi } from './dashboard-api';
import type { PortalApi } from './portal-api';

const DashboardApiContext = createContext<DashboardApi | null>(null);
const PortalApiContext = createContext<PortalApi | null>(null);

export function DashboardApiProvider({
  api,
  children,
}: {
  api: DashboardApi;
  children: ReactNode;
}) {
  return <DashboardApiContext.Provider value={api}>{children}</DashboardApiContext.Provider>;
}

export function PortalApiProvider({ api, children }: { api: PortalApi; children: ReactNode }) {
  return <PortalApiContext.Provider value={api}>{children}</PortalApiContext.Provider>;
}

export function useDashboardApi(): DashboardApi {
  const api = useContext(DashboardApiContext);
  if (!api) throw new Error('useDashboardApi precisa estar dentro do <DashboardApiProvider>');
  return api;
}

export function usePortalApi(): PortalApi {
  const api = useContext(PortalApiContext);
  if (!api) throw new Error('usePortalApi precisa estar dentro do <PortalApiProvider>');
  return api;
}
