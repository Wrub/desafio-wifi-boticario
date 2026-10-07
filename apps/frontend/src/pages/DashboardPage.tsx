import { useEffect, useRef } from 'react';
import { useDashboardApi } from '../api/api-context';
import { ErrorState } from '../components/ErrorState';
import { KpiCard, KpiCardSkeleton } from '../components/KpiCard';
import { StoreDetails } from '../components/StoreDetails';
import { StoreGrid, StoreGridSkeleton } from '../components/StoreGrid';
import { StoreStrip } from '../components/StoreStrip';
import { StoreTabs, StoreTabsSkeleton } from '../components/StoreTabs';
import { MAX_PERIOD, periodToRange } from '../hooks/period';
import { useApiQuery } from '../hooks/use-api-query';
import { useStoreRoute } from '../hooks/use-store-route';

export function DashboardPage() {
  const api = useDashboardApi();
  const { storeId: routeStoreId, navigate } = useStoreRoute();
  const detailsRef = useRef<HTMLDivElement>(null);

  // indicadores e lojas sempre no maior período, o filtro fica só na tabela de visitantes
  const summary = useApiQuery(
    (signal) => api.getVisitsSummary(periodToRange(MAX_PERIOD), signal),
    [api],
  );
  const stores = useApiQuery((signal) => api.listStores(periodToRange(MAX_PERIOD), signal), [api]);

  const selectedStore = routeStoreId
    ? stores.data?.find((store) => store.id === routeStoreId)
    : undefined;
  const storeNotFound = Boolean(routeStoreId && stores.data && !selectedStore);

  useEffect(() => {
    document.title = selectedStore ? `${selectedStore.name} · Wi-Fi das Lojas` : 'Wi-Fi das Lojas';
  }, [selectedStore]);

  useEffect(() => {
    if (routeStoreId && window.matchMedia?.('(max-width: 1023px)').matches) {
      detailsRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    }
  }, [routeStoreId]);

  function selectStore(storeId: string) {
    if (storeId === selectedStore?.id) return;
    navigate(storeId);
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <header className="bg-ink-900">
        <div className="mx-auto max-w-7xl px-4 py-5">
          <h1 className="text-xl font-semibold text-white">Wi-Fi de visitantes</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section aria-label="Todas as lojas" className="grid gap-4 sm:grid-cols-2">
          {summary.data ? (
            <>
              <KpiCard
                label="Visitas na rede"
                value={summary.data.totalVisits}
                hint="Todas as lojas"
              />
              <KpiCard label="Visitantes únicos na rede" value={summary.data.uniqueVisitors} />
            </>
          ) : summary.error ? (
            <div className="sm:col-span-2">
              <ErrorState message={summary.error} onRetry={summary.retry} />
            </div>
          ) : (
            <>
              <KpiCardSkeleton />
              <KpiCardSkeleton />
            </>
          )}
        </section>

        {stores.error ? (
          <ErrorState message={stores.error} onRetry={stores.retry} />
        ) : !routeStoreId ? (
          // nenhuma loja selecionada: só a grade pra escolher
          stores.data ? (
            <StoreGrid stores={stores.data} onSelect={selectStore} loading={stores.loading} />
          ) : (
            <StoreGridSkeleton />
          )
        ) : (
          <div className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
            <aside aria-label="Lojas" className="hidden space-y-3 lg:sticky lg:top-6 lg:block">
              <h2 className="text-sm font-semibold tracking-wide text-ink-500 uppercase">Lojas</h2>
              {stores.data ? (
                <StoreTabs
                  stores={stores.data}
                  selectedId={selectedStore?.id}
                  onSelect={selectStore}
                  loading={stores.loading}
                />
              ) : (
                <StoreTabsSkeleton />
              )}
            </aside>

            <div ref={detailsRef} className="min-w-0 scroll-mt-4">
              {selectedStore ? (
                <StoreDetails
                  key={selectedStore.id}
                  store={selectedStore}
                  onClose={() => navigate(null)}
                  mobileStoreSwitcher={
                    stores.data && (
                      <StoreStrip
                        stores={stores.data}
                        selectedId={selectedStore.id}
                        onSelect={selectStore}
                      />
                    )
                  }
                />
              ) : storeNotFound ? (
                <div className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-ink-500">
                  <p>
                    Loja <span className="font-medium text-ink-900">"{routeStoreId}"</span> não
                    encontrada.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(null)}
                    className="mt-3 rounded-md border border-gray-300 px-4 py-1.5 font-medium text-ink-700 hover:bg-canvas"
                  >
                    Ver todas as lojas
                  </button>
                </div>
              ) : (
                <div aria-hidden className="h-96 animate-pulse rounded-md bg-gray-200" />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
