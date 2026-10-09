import { useState, type ReactNode } from 'react';
import type { VisitsDistribution } from '@wifi/contracts';
import { useDashboardApi } from '../api/api-context';
import { MAX_PERIOD, PERIOD_LABELS, periodToRange, type Period } from '../hooks/period';
import { useApiQuery } from '../hooks/use-api-query';
import type { ChartItem } from '../utils/chart';
import { formatHour, MONTH_LABELS, SEASON_LABELS, WEEKDAY_LABELS } from '../utils/format';
import { BarChart } from './BarChart';
import { ColumnChart } from './ColumnChart';
import { ErrorState } from './ErrorState';
import { PeriodSelector } from './PeriodSelector';

// hoje e 7 dias caem num mês e numa estação só, os gráficos de mês/estação ficariam vazios
const PATTERN_PERIODS: Period[] = ['30d', '12m'];

interface VisitPatternsProps {
  title: string;
  // sem loja = a rede inteira
  storeId?: string;
  headingLevel?: 'h2' | 'h3';
}

// Quando as pessoas usam o Wi-Fi: dia da semana, horário, mês e estação com mais visitas
export function VisitPatterns({ title, storeId, headingLevel = 'h2' }: VisitPatternsProps) {
  const api = useDashboardApi();
  const [period, setPeriod] = useState<Period>(MAX_PERIOD);
  const distribution = useApiQuery(
    (signal) => api.getVisitsDistribution({ ...periodToRange(period), storeId }, signal),
    [api, storeId, period],
  );
  const Heading = headingLevel;

  return (
    <section id="visit-patterns" aria-label={title} className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Heading className="text-base font-semibold text-ink-900">{title}</Heading>
          {!storeId && (
            <p className="text-sm text-ink-500">
              Conexões ao Wi-Fi nos últimos {PERIOD_LABELS[period]} em todas as lojas
            </p>
          )}
        </div>
        <PeriodSelector
          value={period}
          onChange={setPeriod}
          options={PATTERN_PERIODS}
          label="Período dos padrões de acesso"
        />
      </div>

      {distribution.error ? (
        <ErrorState message={distribution.error} onRetry={distribution.retry} />
      ) : distribution.data ? (
        <Patterns data={distribution.data} cardHeading={headingLevel === 'h2' ? 'h3' : 'h4'} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} aria-hidden className="h-56 animate-pulse rounded-md bg-zinc-200" />
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
  const months = data.byMonth.map(({ month, visits }) => ({
    key: month,
    label: MONTH_LABELS[month - 1],
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
      <p className="rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm text-ink-500">
        Sem acessos no período.
      </p>
    );
  }

  const topWeekday = peak(weekdays);
  const topHour = peak(hours);
  const topMonth = peak(months);
  const topSeason = peak(seasons);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PatternCard
        id="pattern-weekday"
        heading={cardHeading}
        label="Dia da semana"
        peak={topWeekday}
      >
        <BarChart items={weekdays} highlightKey={topWeekday.key} />
      </PatternCard>
      <PatternCard id="pattern-hour" heading={cardHeading} label="Horário" peak={topHour}>
        <ColumnChart items={hours} highlightKey={topHour.key} />
      </PatternCard>
      <PatternCard id="pattern-month" heading={cardHeading} label="Mês" peak={topMonth}>
        <ColumnChart
          items={months.map((m) => ({ ...m, shortLabel: m.label.slice(0, 3) }))}
          highlightKey={topMonth.key}
        />
      </PatternCard>
      <PatternCard
        id="pattern-season"
        heading={cardHeading}
        label="Estação do ano"
        peak={topSeason}
      >
        <BarChart items={seasons} highlightKey={topSeason.key} />
      </PatternCard>
    </div>
  );
}

function PatternCard({
  id,
  heading: Heading,
  label,
  peak,
  children,
}: {
  id: string;
  heading: CardHeading;
  label: string;
  peak: ChartItem;
  children: ReactNode;
}) {
  const headingId = `${id}-title`;
  return (
    <article
      id={id}
      aria-labelledby={headingId}
      className="space-y-4 rounded-md border border-zinc-200 bg-surface p-5"
    >
      <div>
        <Heading id={headingId} className="text-sm font-medium text-ink-500">
          {label}
        </Heading>
        <p className="mt-1 text-2xl font-semibold text-ink-900">{peak.label}</p>
      </div>
      {children}
    </article>
  );
}

// empate: fica o primeiro
function peak(items: ChartItem[]): ChartItem {
  return items.reduce((top, item) => (item.value > top.value ? item : top));
}

// loja abre de 8h às 22h: corta as horas vazias do começo e do fim do dia
function trimEmptyEdges(items: ChartItem[]): ChartItem[] {
  const first = items.findIndex((item) => item.value > 0);
  const last = items.length - 1 - [...items].reverse().findIndex((item) => item.value > 0);
  return first === -1 ? items : items.slice(first, last + 1);
}
