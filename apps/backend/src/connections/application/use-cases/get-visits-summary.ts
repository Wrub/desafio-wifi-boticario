import type {
  ConnectionRepository,
  VisitsFilter,
  VisitsSummary,
} from '../ports/connection.repository.js';
import { assertValidPeriod } from '../period.js';

export class GetVisitsSummary {
  constructor(private readonly repository: ConnectionRepository) {}

  async execute(filter: VisitsFilter): Promise<VisitsSummary> {
    assertValidPeriod(filter);
    return this.repository.getVisitsSummary(filter);
  }
}
