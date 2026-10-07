import type { ConnectionRepository, StoreWithMetrics } from '../ports/connection.repository.js';
import { assertValidPeriod, type MetricsPeriod } from '../period.js';

export class ListStores {
  constructor(private readonly repository: ConnectionRepository) {}

  async execute(period: MetricsPeriod): Promise<StoreWithMetrics[]> {
    assertValidPeriod(period);
    return this.repository.listStoresWithMetrics(period);
  }
}
