import { SEASONS, seasonOfMonth, type Season } from '../../domain/season.js';
import type { ConnectionRepository, VisitsFilter } from '../ports/connection.repository.js';
import { assertValidPeriod } from '../period.js';

export interface VisitsDistribution {
  byWeekday: Array<{ weekday: number; visits: number }>;
  byHour: Array<{ hour: number; visits: number }>;
  bySeason: Array<{ season: Season; visits: number }>;
}

// Quando as pessoas usam o Wi-Fi: visitas por dia da semana, hora e estação.
// Devolve todas as chaves, com 0 onde não teve visita, pra o gráfico não ter buraco.
export class GetVisitsDistribution {
  constructor(private readonly repository: ConnectionRepository) {}

  async execute(filter: VisitsFilter): Promise<VisitsDistribution> {
    assertValidPeriod(filter);
    const { byWeekday, byHour, byMonth } = await this.repository.countVisitsByTime(filter);

    const bySeason = new Map<Season, number>();
    for (const [month, visits] of byMonth) {
      const season = seasonOfMonth(month);
      bySeason.set(season, (bySeason.get(season) ?? 0) + visits);
    }

    return {
      byWeekday: range(7).map((weekday) => ({ weekday, visits: byWeekday.get(weekday) ?? 0 })),
      byHour: range(24).map((hour) => ({ hour, visits: byHour.get(hour) ?? 0 })),
      bySeason: SEASONS.map((season) => ({ season, visits: bySeason.get(season) ?? 0 })),
    };
  }
}

function range(length: number): number[] {
  return Array.from({ length }, (_, i) => i);
}
