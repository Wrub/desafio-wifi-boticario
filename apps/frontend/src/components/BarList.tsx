import { formatNumber } from '../utils/format';

export interface BarItem {
  key: string | number;
  label: string;
  value: number;
}

interface BarChartProps {
  items: BarItem[];
  // item em destaque (o maior); os outros ficam num tom mais claro
  highlightKey?: string | number;
}

const tooltip = (item: BarItem) => `${item.label}: ${formatNumber(item.value)} visitas`;

// Barras horizontais, com o valor escrito no fim de cada barra
export function BarList({ items, highlightKey }: BarChartProps) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ol className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.key}
          title={tooltip(item)}
          className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-xs"
        >
          <span className="text-ink-500">{item.label}</span>
          <span className="h-4">
            <span
              className={`block h-full rounded-r ${item.key === highlightKey ? 'bg-brand-500' : 'bg-brand-100'}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="text-right text-ink-700 tabular-nums">{formatNumber(item.value)}</span>
        </li>
      ))}
    </ol>
  );
}

// Colunas na ordem do tempo (ex.: horas do dia); o valor de cada uma fica no tooltip
export function ColumnList({ items, highlightKey }: BarChartProps) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ol className="flex h-32 items-end gap-0.5">
      {items.map((item) => (
        <li
          key={item.key}
          title={tooltip(item)}
          className="flex h-full flex-1 flex-col items-center"
        >
          <span className="flex w-full flex-1 items-end justify-center">
            <span
              className={`block w-full max-w-6 rounded-t ${item.key === highlightKey ? 'bg-brand-500' : 'bg-brand-100'}`}
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="mt-1 text-[10px] text-ink-500">{item.label}</span>
          <span className="sr-only">{formatNumber(item.value)} visitas</span>
        </li>
      ))}
    </ol>
  );
}
