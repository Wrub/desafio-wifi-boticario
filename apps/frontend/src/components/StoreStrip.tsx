import { useEffect, useRef } from 'react';
import type { StoreSummary } from '@wifi/contracts';
import { formatNumber } from '../utils/format';

interface StoreStripProps {
  stores: StoreSummary[];
  selectedId: string;
  onSelect: (storeId: string) => void;
}

// troca de loja no celular: faixa horizontal logo acima da tabela
export function StoreStrip({ stores, selectedId, onSelect }: StoreStripProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);

  // centraliza a loja selecionada na faixa, sem mexer no scroll da página
  useEffect(() => {
    const container = containerRef.current;
    const selected = selectedRef.current;
    if (!container || !selected) return;
    container.scrollLeft = selected.offsetLeft - (container.clientWidth - selected.clientWidth) / 2;
  }, [selectedId]);

  return (
    <nav aria-label="Trocar de loja">
      <div ref={containerRef} className="relative -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {stores.map((store) => {
          const selected = store.id === selectedId;
          return (
            <button
              key={store.id}
              ref={selected ? selectedRef : undefined}
              type="button"
              aria-current={selected ? 'true' : undefined}
              disabled={selected}
              onClick={() => onSelect(store.id)}
              className={`shrink-0 rounded-md border px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${
                selected
                  ? 'border-ink-900 bg-surface shadow-[inset_0_-3px_0_var(--color-accent-500)]'
                  : 'border-gray-200 bg-surface'
              }`}
            >
              <span className="block text-sm font-medium whitespace-nowrap text-ink-900">
                {store.name}
              </span>
              <span className="block text-xs whitespace-nowrap text-ink-500">
                {formatNumber(store.totalVisits)} visitas
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
