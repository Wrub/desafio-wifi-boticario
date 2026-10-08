export type Season = 'verao' | 'outono' | 'inverno' | 'primavera';

export const SEASONS: Season[] = ['verao', 'outono', 'inverno', 'primavera'];

// Estações do hemisfério sul pelo mês (1 a 12), sem as datas exatas de solstício e equinócio:
// verão = dez a fev, outono = mar a mai, inverno = jun a ago, primavera = set a nov
export function seasonOfMonth(month: number): Season {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`mês inválido: ${month}`);
  }
  return SEASONS[Math.floor((month % 12) / 3)];
}
