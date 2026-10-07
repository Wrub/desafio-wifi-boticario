import { useRef, useState, type KeyboardEvent } from 'react';
import type { StoreSummary } from '@wifi/contracts';
import { formatNumber } from '../utils/format';
import { filterStores } from '../utils/store-filter';
import { SearchInput } from './SearchInput';

interface StoreTabsProps {
  stores: StoreSummary[];
  selectedId: string | undefined;
  onSelect: (storeId: string) => void;
  loading?: boolean;
}

export const storeTabId = (storeId: string) => `store-tab-${storeId}`;
export const STORE_PANEL_ID = 'store-panel';

export function StoreTabs({ stores, selectedId, onSelect, loading }: StoreTabsProps) {
  const [search, setSearch] = useState('');
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  const visible = filterStores(stores, search);

  // só uma aba entra no Tab do teclado: a selecionada, ou a primeira se ela estiver escondida pelo filtro
  const focusableId = visible.some((s) => s.id === selectedId) ? selectedId : visible[0]?.id;

  function handleKeyDown(event: KeyboardEvent, index: number) {
    const moves: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowUp: index - 1,
      Home: 0,
      End: visible.length - 1,
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    const next = visible[(moves[event.key] + visible.length) % visible.length];
    onSelect(next.id);
    tabRefs.current.get(next.id)?.focus();
  }

  return (
    <div className="space-y-3">
      <SearchInput
        label="Buscar loja"
        placeholder="Buscar loja ou cidade"
        value={search}
        onChange={setSearch}
      />

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-gray-300 p-4 text-center text-sm text-ink-500">
          Nenhuma loja encontrada.
        </p>
      ) : (
        <div
          role="tablist"
          aria-label="Lojas"
          aria-orientation="vertical"
          className={`flex max-h-80 flex-col gap-1 overflow-y-auto lg:max-h-none ${
            loading ? 'opacity-60' : ''
          }`}
        >
          {visible.map((store, index) => {
            const selected = store.id === selectedId;
            return (
              <button
                key={store.id}
                ref={(el) => {
                  if (el) tabRefs.current.set(store.id, el);
                  else tabRefs.current.delete(store.id);
                }}
                id={storeTabId(store.id)}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={STORE_PANEL_ID}
                tabIndex={store.id === focusableId ? 0 : -1}
                onClick={() => onSelect(store.id)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`flex w-full items-center justify-between gap-3 rounded-md border px-4 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                  selected
                    ? 'cursor-not-allowed border-ink-900 bg-surface shadow-[inset_4px_0_0_var(--color-accent-500)]'
                    : 'border-transparent bg-surface hover:border-gray-200 hover:bg-canvas'
                }`}
              >
                <span className="min-w-0">
                  <span
                    className={`block truncate font-medium ${selected ? 'text-ink-900' : 'text-ink-700'}`}
                  >
                    {store.name}
                  </span>
                  <span className="block truncate text-xs text-ink-500">{store.city}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-sm font-semibold text-ink-900 tabular-nums">
                    {formatNumber(store.totalVisits)}
                  </span>
                  <span className="block text-xs text-ink-500">visitas</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function StoreTabsSkeleton() {
  return (
    <div aria-hidden className="space-y-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-md bg-gray-200" />
      ))}
    </div>
  );
}
