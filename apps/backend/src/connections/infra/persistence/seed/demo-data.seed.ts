import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import {
  CONNECTION_REPOSITORY,
  type ConnectionRepository,
} from '../../../application/ports/connection.repository.js';
import { WifiConnection } from '../../../domain/wifi-connection.js';
import { StoreOrmEntity } from '../store.orm-entity.js';
import { WifiConnectionOrmEntity } from '../wifi-connection.orm-entity.js';
import { DEMO_STORES, generateDemoConnections } from './demo-data.js';

// Popula o banco no boot pra quem abrir o dashboard já ver dado.
// As conexões vão direto pro repositório, sem passar pela fila: aqui é carga inicial.
// Pra testar o fluxo completo (API -> RabbitMQ -> banco) usar o scripts/simulate-connections.mjs.
@Injectable()
export class DemoDataSeed implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoDataSeed.name);

  constructor(
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(ConfigService) private readonly config: ConfigService,
    @Inject(CONNECTION_REPOSITORY) private readonly connections: ConnectionRepository,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    if (this.config.get('SEED_STORES') === 'true') {
      await this.seedStores();
    }
    if (this.config.get('SEED_CONNECTIONS') === 'true') {
      await this.seedConnections(Number(this.config.get('SEED_CONNECTIONS_COUNT', 6000)));
    }
  }

  private async seedStores(): Promise<void> {
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into(StoreOrmEntity)
      .values(DEMO_STORES)
      .orIgnore()
      .execute();
    this.logger.log(`${DEMO_STORES.length} lojas de exemplo ok`);
  }

  private async seedConnections(count: number): Promise<void> {
    const existing = await this.dataSource.getRepository(WifiConnectionOrmEntity).count();
    if (existing > 0) {
      this.logger.log(`já tem ${existing} conexões no banco, pulando o seed`);
      return;
    }

    const started = Date.now();
    // passo pela entidade de domínio, então CPF/MAC inválido aqui também quebraria
    for (const props of generateDemoConnections(count)) {
      await this.connections.save(WifiConnection.create(props));
    }
    this.logger.log(`${count} conexões de exemplo criadas em ${Date.now() - started}ms`);
  }
}
