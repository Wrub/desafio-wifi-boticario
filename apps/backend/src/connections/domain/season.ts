export type Season = 'verao' | 'outono' | 'inverno' | 'primavera';

export const SEASONS: Season[] = ['verao', 'outono', 'inverno', 'primavera'];

export function seasonOfMonth(month: number): Season {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`mês inválido: ${month}`);
  }
  return SEASONS[Math.floor((month % 12) / 3)];
}
