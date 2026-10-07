import { Controller, Get, Inject, Query } from '@nestjs/common';
import { visitsQuerySchema, type VisitsQuery, type VisitsSummary } from '@wifi/contracts';
import { GetVisitsSummary } from '../../application/use-cases/get-visits-summary.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

@Controller('metrics')
export class MetricsController {
  constructor(@Inject(GetVisitsSummary) private readonly getVisitsSummary: GetVisitsSummary) {}

  @Get('visits')
  visits(
    @Query(new ZodValidationPipe(visitsQuerySchema)) query: VisitsQuery,
  ): Promise<VisitsSummary> {
    return this.getVisitsSummary.execute(query);
  }
}
