import { useState, type ReactNode } from 'react';
import type { StoreSummary } from '@wifi/contracts';
import { useDashboardApi } from '../api/api-context';
import { MAX_PERIOD, periodToRange, type Period } from '../hooks/period';
import { useApiQuery } from '../hooks/use-api-query';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { ErrorState } from './ErrorState';
import { KpiCard } from './KpiCard';
import { PeriodSelector } from './PeriodSelector';
import { SearchFilter } from './SearchFilter';
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
          className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-surface py-1.5 pr-3 pl-2 text-sm font-medium text-ink-700 shadow-xs transition-colors hover:bg-zinc-100 hover:text-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
        >
          <svg aria-hidden viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path
              fillRule="evenodd"
              d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
          Todas as lojas
        </button>
      </div>

      <div id="store-kpis" className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Acessos ao Wi-Fi"
          value={store.totalVisits}
          hint="Conexões ao Wi-Fi nos últimos 12 meses"
        />
        <KpiCard
          label="Usuários únicos"
          value={store.uniqueVisitors}
          hint="Pessoas diferentes (por número de celular)"
        />
        <KpiCard
          label="Acessos por pessoa"
          value={visitsPerVisitor}
          fractionDigits={1}
          hint="Quantas vezes cada pessoa acessa o Wi-Fi, em média"
        />
      </div>

      <VisitPatterns
        title="Quando o Wi-Fi da loja é mais acessado"
        storeId={store.id}
        headingLevel="h3"
      />

      {mobileStoreSwitcher && <div className="lg:hidden">{mobileStoreSwitcher}</div>}

      <div id="store-visitors" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-ink-900">Quem usou o Wi-Fi</h3>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PeriodSelector value={period} onChange={setPeriod} />
          <div className="w-full sm:w-72">
            <SearchFilter
              label="Buscar usuário"
              placeholder="Buscar por nome ou e-mail"
              value={search}
              onChange={setSearch}
            />
          </div>
        </div>

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
