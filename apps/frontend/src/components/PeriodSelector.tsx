import { PERIOD_LABELS, type Period } from '../hooks/period';

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div role="group" aria-label="Período" className="inline-flex rounded-md bg-white/10 p-1">
      {(Object.keys(PERIOD_LABELS) as Period[]).map((period) => (
        <button
          key={period}
          type="button"
          aria-pressed={value === period}
          onClick={() => onChange(period)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            value === period ? 'bg-surface text-ink-900' : 'text-white/80 hover:text-white'
          }`}
        >
          {PERIOD_LABELS[period]}
        </button>
      ))}
    </div>
  );
}
