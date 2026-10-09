import { formatNumber } from '../utils/format';

interface KpiCardProps {
  label: string;
  value: number;
  hint?: string;
  fractionDigits?: number;
}

export function KpiCard({ label, value, hint, fractionDigits = 0 }: KpiCardProps) {
  return (
    <article className="rounded-md border border-sand-200 bg-surface p-5">
      <h3 className="text-sm font-medium text-ink-500">{label}</h3>
      <p className="mt-2 text-3xl font-semibold text-ink-900 tabular-nums">
        {formatNumber(value, fractionDigits)}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </article>
  );
}

export function KpiCardSkeleton() {
  return (
    <div aria-hidden className="h-29 animate-pulse rounded-md border border-sand-200 bg-sand-200" />
  );
}
