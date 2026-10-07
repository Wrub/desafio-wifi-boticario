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
