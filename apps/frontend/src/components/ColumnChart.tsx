import { chartTooltip, type ChartProps } from '../utils/chart';
import { formatNumber } from '../utils/format';

// Colunas na ordem do tempo (ex.: horas do dia); o valor de cada uma fica no tooltip
export function ColumnChart({ items, highlightKey }: ChartProps) {
  const max = Math.max(1, ...items.map((item) => item.value));

  return (
    <ol className="flex h-32 items-end gap-0.5">
      {items.map((item) => (
        <li
          key={item.key}
          title={chartTooltip(item)}
          className="flex h-full flex-1 flex-col items-center"
        >
          <span className="flex w-full flex-1 items-end justify-center">
            <span
              className={`block w-full max-w-6 rounded-t ${item.key === highlightKey ? 'bg-brand-500' : 'bg-zinc-300'}`}
              style={{ height: `${(item.value / max) * 100}%` }}
            />
          </span>
          <span className="mt-1 text-[10px] text-ink-500">{item.shortLabel ?? item.label}</span>
          <span className="sr-only">{formatNumber(item.value)} acessos</span>
        </li>
      ))}
    </ol>
  );
}
