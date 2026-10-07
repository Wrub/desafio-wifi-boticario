import { useState } from 'react';
import type { StoreSummary } from '@wifi/contracts';
import { useDashboardApi } from '../api/api-context';
import { periodToRange, type Period } from '../hooks/period';
import { useApiQuery } from '../hooks/use-api-query';
import { useDebouncedValue } from '../hooks/use-debounced-value';
import { ErrorState } from './ErrorState';
import { KpiCard } from './KpiCard';
import { SearchInput } from './SearchInput';
import { STORE_PANEL_ID } from './StoreTabs';
import { TableSkeleton, VisitorsTable } from './VisitorsTable';

const PAGE_SIZE = 10;

interface StoreDetailsProps {
  store: StoreSummary;
  period: Period;
  onClose: () => void;
}

export function StoreDetails({ store, period, onClose }: StoreDetailsProps) {
  const api = useDashboardApi();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());

  // a página fica "presa" à busca: mudou a busca, volta pra página 1 sem precisar de useEffect
  const [pageState, setPageState] = useState({ search: '', page: 1 });
  const page = pageState.search === debouncedSearch ? pageState.page : 1;
  const setPage = (next: number) => setPageState({ search: debouncedSearch, page: next });

  const visitors = useApiQuery(
    (signal) =>
      api.listStoreVisitors(
        store.id,
        { ...periodToRange(period), page, pageSize: PAGE_SIZE, search: debouncedSearch },
        signal,
      ),
    [api, store.id, period, page, debouncedSearch],
  );

  // os números dos cards já vêm junto da lista de lojas, não preciso de outra request
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
        <KpiCard label="Visitas" value={store.totalVisits} hint="Conexões ao Wi-Fi no período" />
        <KpiCard
          label="Visitantes únicos"
          value={store.uniqueVisitors}
          hint="Pessoas diferentes (por CPF)"
        />
        <KpiCard
          label="Visitas por pessoa"
          value={visitsPerVisitor}
          fractionDigits={1}
          hint="Quanto o cliente volta, em média"
        />
      </div>

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
