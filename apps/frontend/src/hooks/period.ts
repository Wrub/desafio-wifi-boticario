export type Period = 'today' | '7d' | '30d';

export const PERIOD_LABELS: Record<Period, string> = {
  today: 'Hoje',
  '7d': '7 dias',
  '30d': '30 dias',
};

// período vai da meia-noite (hora local) de X dias atrás até agora
export function periodToRange(period: Period, now: Date = new Date()): { from: Date; to: Date } {
  const daysBack = { today: 0, '7d': 6, '30d': 29 }[period];
  const from = new Date(now);
  from.setDate(from.getDate() - daysBack);
  from.setHours(0, 0, 0, 0);
  return { from, to: now };
}
