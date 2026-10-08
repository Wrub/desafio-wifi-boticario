import { useState, type ReactNode } from 'react';
import type { StoreSummary } from '@wifi/contracts';
import { useDashboardApi } from '../api/api-context';
import { MAX_PERIOD, periodToRange, type Period } from '../hooks/period';
import { useApiQuery } from '../hooks/use-api-query';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { ErrorState } from './ErrorState';
import { KpiCard } from './KpiCard';
import { PeriodSelector } from './PeriodSelector';
import { SearchInput } from './SearchInput';
import { STORE_PANEL_ID } from './StoreTabs';
import { TableSkeleton, VisitorsTable } from './VisitorsTable';
import { VisitPatterns } from './VisitPatterns';

const PAGE_SIZE = 10;

interface StoreDetailsProps {
  store: StoreSummary;
  onClose: () => void;
  // troca de loja que aparece só no celular, logo acima da tabela
  mobileStoreSwitcher?: ReactNode;
}

export function StoreDetails({ store, onClose, mobileStoreSwitcher }: StoreDetailsProps) {
  const api = useDashboardApi();
  const [period, setPeriod] = useState<Period>(MAX_PERIOD);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());

  // trocar a busca ou o período volta pra primeira página
  const [pageState, setPageState] = useState({ search: '', period: MAX_PERIOD, page: 1 });
  const page =
    pageState.search === debouncedSearch && pageState.period === period ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ search: debouncedSearch, period, page: next });

  const visitors = useApiQuery(
    (signal) =>
      api.listStoreVisitors(
        store.id,
        { ...periodToRange(period), page, pageSize: PAGE_SIZE, search: debouncedSearch },
        signal,
      ),
    [api, store.id, period, page, debouncedSearch],
  );

  const visitsPerVisitor = store.uniqueVisitors > 0 ? store.totalVisits / store.uniqueVisitors : 0;

  return (
    <section id={STORE_PANEL_ID} role="tabpanel" aria-label={store.name} className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">{store.name}</h2>
          <p className="text-sm text-ink-500">{store.city}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          ← Todas as lojas
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Visitas"
          value={store.totalVisits}
          hint="Conexões ao Wi-Fi nos últimos 12 meses"
        />
        <KpiCard
          label="Visitantes únicos"
          value={store.uniqueVisitors}
          hint="Pessoas diferentes (por celular)"
        />
        <KpiCard
          label="Visitas por pessoa"
          value={visitsPerVisitor}
          fractionDigits={1}
          hint="Quanto o cliente volta, em média"
        />
      </div>

      <VisitPatterns title="Quando a loja é mais visitada" storeId={store.id} headingLevel="h3" />

      {mobileStoreSwitcher && <div className="lg:hidden">{mobileStoreSwitcher}</div>}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-ink-900">Quem usou o Wi-Fi</h3>
          <div className="w-full sm:w-72">
            <SearchInput
              label="Buscar visitante"
              placeholder="Buscar por nome ou e-mail"
              value={search}
              onChange={setSearch}
            />
          </div>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />

        {visitors.error && <ErrorState message={visitors.error} onRetry={visitors.retry} />}
        {!visitors.error && !visitors.data && <TableSkeleton />}
        {!visitors.error && visitors.data && (
          <VisitorsTable
            page={visitors.data}
            onPageChange={setPage}
            loading={visitors.loading}
            search={debouncedSearch}
          />
        )}
      </div>
    </section>
  );
}
