import { Controller, Get, Inject, Param, Query } from '@nestjs/common';
import {
  storeIdParamSchema,
  storesQuerySchema,
  storeVisitorsQuerySchema,
  type StoreSummary,
  type StoreVisitorsPage,
  type StoresQuery,
  type StoreVisitorsQuery,
} from '@wifi/contracts';
import { ListStoreVisitors } from '../../application/use-cases/list-store-visitors.js';
import { ListStores } from '../../application/use-cases/list-stores.js';
import { ZodValidationPipe } from './zod-validation.pipe.js';

@Controller('stores')
export class StoresController {
  constructor(
    @Inject(ListStores) private readonly listStores: ListStores,
    @Inject(ListStoreVisitors) private readonly listStoreVisitors: ListStoreVisitors,
  ) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(storesQuerySchema)) query: StoresQuery,
  ): Promise<StoreSummary[]> {
    return this.listStores.execute(query);
  }

  @Get(':storeId/visitors')
  async visitors(
    @Param('storeId', new ZodValidationPipe(storeIdParamSchema)) storeId: string,
    @Query(new ZodValidationPipe(storeVisitorsQuerySchema)) query: StoreVisitorsQuery,
  ): Promise<StoreVisitorsPage> {
    const { page, pageSize, ...filter } = query;
    const result = await this.listStoreVisitors.execute({ ...filter, storeId }, { page, pageSize });

    // Date -> string ISO pra bater com o contrato entre back e front
    return {
      ...result,
      items: result.items.map((item) => ({
        ...item,
        visitTimes: item.visitTimes.map((time) => time.toISOString()),
        lastConnectedAt: item.lastConnectedAt.toISOString(),
      })),
    };
  }
}
