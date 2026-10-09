import { Cpf } from '../../domain/cpf.js';
import { NotFoundError } from '../../domain/domain.error.js';
import type {
  ConnectionRepository,
  Pagination,
  StoreVisitorRow,
  StoreVisitorsFilter,
} from '../ports/connection.repository.js';
import { assertValidPeriod } from '../period.js';

export type StoreVisitorView = Omit<StoreVisitorRow, 'cpf' | 'visitorId'> & {
  id: string;
  maskedCpf: string | null;
};

export interface StoreVisitorsResult extends Pagination {
  items: StoreVisitorView[];
  total: number;
}

export class ListStoreVisitors {
  constructor(private readonly repository: ConnectionRepository) {}

  async execute(filter: StoreVisitorsFilter, pagination: Pagination): Promise<StoreVisitorsResult> {
    assertValidPeriod(filter);
    if (!(await this.repository.storeExists(filter.storeId))) {
      throw new NotFoundError(`loja ${filter.storeId} não encontrada`);
    }

    const search = filter.search?.trim() || undefined;
    const { items, total } = await this.repository.listStoreVisitors(
      { ...filter, search },
      pagination,
    );

    return {
      ...pagination,
      total,
      // mascara do CPF
      items: items.map(({ visitorId, cpf, ...rest }) => ({
        ...rest,
        id: visitorId,
        maskedCpf: cpf ? Cpf.mask(cpf) : null,
      })),
    };
  }
}
