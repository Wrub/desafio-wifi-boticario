import { chartTooltip, type ChartProps } from '../utils/chart';
import { formatNumber } from '../utils/format';

// Barras horizontais, com o valor escrito no fim de cada barra
export function BarChart({ items, highlightKey }: ChartProps) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ol className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.key}
          title={chartTooltip(item)}
          className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-xs"
        >
          <span className="text-ink-500">{item.label}</span>
          <span className="h-4">
            <span
              className={`block h-full rounded-r ${item.key === highlightKey ? 'bg-brand-500' : 'bg-zinc-300'}`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="text-right text-ink-700 tabular-nums">{formatNumber(item.value)}</span>
        </li>
      ))}
    </ol>
  );
}
