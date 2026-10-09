import { useEffect, useRef, useState } from 'react';
import { useDashboardApi } from '../api/api-context';
import { ErrorState } from '../components/ErrorState';
import { GrupoBoticarioLogo } from '../components/GrupoBoticarioLogo';
import { KpiCard, KpiCardSkeleton } from '../components/KpiCard';
import { StoreDetails } from '../components/StoreDetails';
import { StoreGrid, StoreGridSkeleton } from '../components/StoreGrid';
import { StoreStrip } from '../components/StoreStrip';
import { StoreTabs, StoreTabsSkeleton } from '../components/StoreTabs';
import { VisitPatterns } from '../components/VisitPatterns';
import { MAX_PERIOD, periodToRange } from '../hooks/period';
import { useApiQuery } from '../hooks/use-api-query';
import { useStoreRoute } from '../hooks/use-store-route';

export function DashboardPage() {
  const api = useDashboardApi();
  const { storeId: routeStoreId, navigate } = useStoreRoute();
  const detailsRef = useRef<HTMLDivElement>(null);
  const [storeListOpen, setStoreListOpen] = useState(true);

  // indicadores e lojas sempre nos 12 meses; padrões e tabela têm filtro próprio
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
    document.title = selectedStore
      ? `Grupo Boticário | Wi-Fi Dashboard · ${selectedStore.name}`
      : 'Grupo Boticário | Wi-Fi Dashboard';
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
    <div className="min-h-screen bg-canvas">
      <header className="border-b-4 border-brand-500 bg-ink-900">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <GrupoBoticarioLogo className="h-8 w-auto text-white sm:h-9" />
            <span aria-hidden className="hidden h-7 w-px bg-white/30 sm:block" />
            <h1 className="text-xl font-semibold text-white">Wi-Fi de visitantes</h1>
          </div>
          <a
            href="/portal"
            className="rounded-md border border-white/30 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Simular captive portal
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <section
          id="network-kpis"
          aria-label="Todas as lojas"
          className="grid gap-4 sm:grid-cols-2"
        >
          {summary.data ? (
            <>
              <KpiCard
                label="Acessos ao Wi-Fi na rede"
                value={summary.data.totalVisits}
                hint="Todas as lojas"
              />
              <KpiCard label="Usuários únicos na rede" value={summary.data.uniqueVisitors} />
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

        {!routeStoreId && <VisitPatterns title="Quando o Wi-Fi da rede é mais acessado" />}

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
          <div
            className={`grid grid-cols-1 gap-6 lg:items-start ${
              storeListOpen
                ? 'lg:grid-cols-[18rem_minmax(0,1fr)]'
                : 'lg:grid-cols-[2.5rem_minmax(0,1fr)]'
            }`}
          >
            <aside
              id="store-list"
              aria-label="Lojas"
              className="hidden space-y-3 lg:sticky lg:top-6 lg:block"
            >
              <div className="flex items-center justify-between gap-2">
                {storeListOpen && (
                  <h2 className="text-sm font-semibold tracking-wide text-ink-500 uppercase">
                    Lojas
                  </h2>
                )}
                <button
                  type="button"
                  onClick={() => setStoreListOpen(!storeListOpen)}
                  aria-expanded={storeListOpen}
                  aria-controls="store-list-items"
                  aria-label={storeListOpen ? 'Recolher lista de lojas' : 'Mostrar lista de lojas'}
                  title={storeListOpen ? 'Recolher lista de lojas' : 'Mostrar lista de lojas'}
                  className="flex size-10 items-center justify-center rounded-md border border-zinc-300 bg-surface text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 active:bg-ink-700"
                >
                  <span aria-hidden>{storeListOpen ? '«' : '»'}</span>
                </button>
              </div>
              <div id="store-list-items" hidden={!storeListOpen}>
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
              </div>
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
                <div className="rounded-md border border-dashed border-sand-300 p-6 text-center text-sm text-ink-500">
                  <p>
                    Loja <span className="font-medium text-ink-900">"{routeStoreId}"</span> não
                    encontrada.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(null)}
                    className="mt-3 rounded-md border border-sand-300 px-4 py-1.5 font-medium text-ink-700 transition-colors hover:border-ink-900 hover:bg-ink-900 hover:text-white"
                  >
                    Ver todas as lojas
                  </button>
                </div>
              ) : (
                <div aria-hidden className="h-96 animate-pulse rounded-md bg-sand-200" />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
