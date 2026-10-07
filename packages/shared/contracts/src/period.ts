import { z } from 'zod';

export const periodFields = {
  from: z.coerce.date(),
  to: z.coerce.date(),
};

export const fromBeforeTo = (q: { from: Date; to: Date }) => q.from <= q.to;
export const fromBeforeToError = {
  message: '"from" precisa ser menor ou igual a "to"',
  path: ['from'],
};
