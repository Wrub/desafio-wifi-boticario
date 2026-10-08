import { z } from 'zod';
import { fromBeforeTo, fromBeforeToError, periodFields } from './period.js';

export const visitsQuerySchema = z
  .object({
    ...periodFields,
    storeId: z.string().trim().min(1).optional(),
  })
  .refine(fromBeforeTo, fromBeforeToError);
export type VisitsQuery = z.infer<typeof visitsQuerySchema>;

export const visitsSummarySchema = z.object({
  totalVisits: z.number().int().nonnegative(),
  uniqueVisitors: z.number().int().nonnegative(),
});
export type VisitsSummary = z.infer<typeof visitsSummarySchema>;

export const SEASONS = ['verao', 'outono', 'inverno', 'primavera'] as const;
export const seasonSchema = z.enum(SEASONS);
export type Season = z.infer<typeof seasonSchema>;

const visitsCount = z.number().int().nonnegative();

// Visitas por dia da semana (0 = domingo), hora, mês (1 = janeiro) e estação, no horário de Brasília
export const visitsDistributionSchema = z.object({
  byWeekday: z
    .array(z.object({ weekday: z.number().int().min(0).max(6), visits: visitsCount }))
    .length(7),
  byHour: z
    .array(z.object({ hour: z.number().int().min(0).max(23), visits: visitsCount }))
    .length(24),
  byMonth: z
    .array(z.object({ month: z.number().int().min(1).max(12), visits: visitsCount }))
    .length(12),
  bySeason: z.array(z.object({ season: seasonSchema, visits: visitsCount })).length(4),
});
export type VisitsDistribution = z.infer<typeof visitsDistributionSchema>;
