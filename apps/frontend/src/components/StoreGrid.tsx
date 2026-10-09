import { useState } from 'react';
import type { StoreSummary } from '@wifi/contracts';
import { formatNumber } from '../utils/format';
import { filterStores } from '../utils/store-filter';
import { SearchFilter } from './SearchFilter';

interface StoreGridProps {
  stores: StoreSummary[];
  onSelect: (storeId: string) => void;
  loading?: boolean;
}

export function StoreGrid({ stores, onSelect, loading }: StoreGridProps) {
  const [search, setSearch] = useState('');
  const visible = filterStores(stores, search);

  return (
    <section id="store-grid" aria-labelledby="store-grid-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="store-grid-title" className="text-lg font-semibold text-ink-900">
            Lojas
          </h2>
          <p className="text-sm text-ink-500">Escolha uma loja para ver quem usou o Wi-Fi.</p>
        </div>
        <div className="w-full sm:w-72">
          <SearchFilter
            label="Buscar loja"
            placeholder="Buscar loja ou cidade"
            value={search}
            onChange={setSearch}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-sand-300 p-6 text-center text-sm text-ink-500">
          {stores.length === 0 ? 'Nenhuma loja cadastrada ainda.' : 'Nenhuma loja encontrada.'}
        </p>
      ) : (
        <ul className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
          {visible.map((store) => (
            <li key={store.id}>
              <button
                type="button"
                onClick={() => onSelect(store.id)}
                className="flex h-full w-full flex-col rounded-md border border-sand-200 bg-surface p-5 text-left transition-colors hover:border-ink-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <span className="font-semibold text-ink-900">{store.name}</span>
                <span className="text-sm text-ink-500">{store.city}</span>
                <span className="mt-4 grid grid-cols-2 gap-4 border-t border-sand-100 pt-4">
                  <span>
                    <span className="block text-2xl font-semibold text-ink-900 tabular-nums">
                      {formatNumber(store.totalVisits)}
                    </span>
                    <span className="block text-xs text-ink-500">acessos</span>
                  </span>
                  <span>
                    <span className="block text-2xl font-semibold text-ink-900 tabular-nums">
                      {formatNumber(store.uniqueVisitors)}
                    </span>
                    <span className="block text-xs text-ink-500">usuários únicos</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function StoreGridSkeleton() {
  return (
    <div aria-hidden className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-36 animate-pulse rounded-md bg-sand-200" />
      ))}
    </div>
  );
}
