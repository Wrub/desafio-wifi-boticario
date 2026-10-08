import { useId, type ReactNode } from 'react';
import type { VisitsDistribution } from '@wifi/contracts';
import { useDashboardApi } from '../api/api-context';
import { MAX_PERIOD, periodToRange } from '../hooks/period';
import { useApiQuery } from '../hooks/use-api-query';
import { formatHour, formatNumber, SEASON_LABELS, WEEKDAY_LABELS } from '../utils/format';
import { BarList, ColumnList, type BarItem } from './BarList';
import { ErrorState } from './ErrorState';

interface VisitPatternsProps {
  title: string;
  // sem loja = a rede inteira
  storeId?: string;
  headingLevel?: 'h2' | 'h3';
}

// Quando as pessoas usam o Wi-Fi: dia da semana, horário e estação com mais visitas
export function VisitPatterns({ title, storeId, headingLevel = 'h2' }: VisitPatternsProps) {
  const api = useDashboardApi();
  const distribution = useApiQuery(
    (signal) => api.getVisitsDistribution({ ...periodToRange(MAX_PERIOD), storeId }, signal),
    [api, storeId],
  );
  const Heading = headingLevel;

  return (
    <section aria-label={title} className="space-y-3">
      <div>
        <Heading className="text-base font-semibold text-ink-900">{title}</Heading>
        <p className="text-sm text-ink-500">Conexões ao Wi-Fi nos últimos 12 meses</p>
      </div>

      {distribution.error ? (
        <ErrorState message={distribution.error} onRetry={distribution.retry} />
      ) : distribution.data ? (
        <Patterns data={distribution.data} cardHeading={headingLevel === 'h2' ? 'h3' : 'h4'} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} aria-hidden className="h-56 animate-pulse rounded-md bg-gray-200" />
          ))}
        </div>
      )}
    </section>
  );
}

type CardHeading = 'h3' | 'h4';

function Patterns({ data, cardHeading }: { data: VisitsDistribution; cardHeading: CardHeading }) {
  const weekdays = data.byWeekday.map(({ weekday, visits }) => ({
    key: weekday,
    label: WEEKDAY_LABELS[weekday],
    value: visits,
  }));
  const seasons = data.bySeason.map(({ season, visits }) => ({
    key: season,
    label: SEASON_LABELS[season],
    value: visits,
  }));
  const hours = trimEmptyEdges(
    data.byHour.map(({ hour, visits }) => ({ key: hour, label: formatHour(hour), value: visits })),
  );

  if (weekdays.every((item) => item.value === 0)) {
    return (
      <p className="rounded-md border border-dashed border-gray-300 p-6 text-center text-sm text-ink-500">
        Sem visitas no período.
      </p>
    );
  }

  const topWeekday = peak(weekdays);
  const topHour = peak(hours);
  const topSeason = peak(seasons);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <PatternCard heading={cardHeading} label="Dia da semana" peak={topWeekday}>
        <BarList items={weekdays} highlightKey={topWeekday.key} />
      </PatternCard>
      <PatternCard heading={cardHeading} label="Horário" peak={topHour}>
        <ColumnList items={hours} highlightKey={topHour.key} />
      </PatternCard>
      <PatternCard heading={cardHeading} label="Estação do ano" peak={topSeason}>
        <BarList items={seasons} highlightKey={topSeason.key} />
      </PatternCard>
    </div>
  );
}

function PatternCard({
  heading: Heading,
  label,
  peak,
  children,
}: {
  heading: CardHeading;
  label: string;
  peak: BarItem;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <article
      aria-labelledby={headingId}
      className="space-y-4 rounded-md border border-gray-200 bg-surface p-5"
    >
      <div>
        <Heading id={headingId} className="text-sm font-medium text-ink-500">
          {label}
        </Heading>
        <p className="mt-1 text-2xl font-semibold text-ink-900">{peak.label}</p>
        <p className="text-xs text-ink-400">
          {formatNumber(peak.value)} visitas, o maior movimento
        </p>
      </div>
      {children}
    </article>
  );
}

// empate: fica o primeiro
function peak(items: BarItem[]): BarItem {
  return items.reduce((top, item) => (item.value > top.value ? item : top));
}

// loja abre de 10h às 22h: corta as horas vazias do começo e do fim do dia
function trimEmptyEdges(items: BarItem[]): BarItem[] {
  const first = items.findIndex((item) => item.value > 0);
  const last = items.length - 1 - [...items].reverse().findIndex((item) => item.value > 0);
  return first === -1 ? items : items.slice(first, last + 1);
}
