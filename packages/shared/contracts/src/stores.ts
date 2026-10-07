import { z } from 'zod';
import { deviceTypeSchema } from './connections.js';
import { fromBeforeTo, fromBeforeToError, periodFields } from './period.js';

export const storeIdParamSchema = z.string().trim().min(1).max(64);

export const storesQuerySchema = z.object(periodFields).refine(fromBeforeTo, fromBeforeToError);
export type StoresQuery = z.infer<typeof storesQuerySchema>;

export const storeSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string(),
  totalVisits: z.number().int().nonnegative(),
  uniqueVisitors: z.number().int().nonnegative(),
});
export type StoreSummary = z.infer<typeof storeSummarySchema>;

export const storesResponseSchema = z.array(storeSummarySchema);

export const storeVisitorsQuerySchema = z
  .object({
    ...periodFields,
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    // busca por nome ou e-mail
    search: z.string().trim().max(100).optional(),
  })
  .refine(fromBeforeTo, fromBeforeToError);
export type StoreVisitorsQuery = z.infer<typeof storeVisitorsQuerySchema>;
export type StoreVisitorsQueryInput = z.input<typeof storeVisitorsQuerySchema>;

export const storeVisitorSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  // vem sempre mascarado da API
  maskedCpf: z.string(),
  email: z.string(),
  visits: z.number().int().positive(),
  // horário de cada visita no período, da primeira pra última
  visitTimes: z.array(z.iso.datetime({ offset: true })),
  lastConnectedAt: z.iso.datetime({ offset: true }),
  lastDevice: z.object({
    macAddress: z.string(),
    type: deviceTypeSchema,
    os: z.string().nullable(),
  }),
});
export type StoreVisitor = z.infer<typeof storeVisitorSchema>;

export const storeVisitorsPageSchema = z.object({
  items: z.array(storeVisitorSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  total: z.number().int().nonnegative(),
});
export type StoreVisitorsPage = z.infer<typeof storeVisitorsPageSchema>;
