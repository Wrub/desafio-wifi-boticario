import { DomainError } from '../domain/domain.error.js';

export interface MetricsPeriod {
  from: Date;
  to: Date;
}

// limite de solicitação de métricas para evitar sobrecarga do banco de dados
const MAX_PERIOD_DAYS = 366;

export function assertValidPeriod({ from, to }: MetricsPeriod): void {
  const days = (to.getTime() - from.getTime()) / 86_400_000;
  if (days < 0) {
    throw new DomainError('"from" precisa ser menor ou igual a "to"');
  }
  if (days > MAX_PERIOD_DAYS) {
    throw new DomainError(`o período não pode passar de ${MAX_PERIOD_DAYS} dias`);
  }
}
