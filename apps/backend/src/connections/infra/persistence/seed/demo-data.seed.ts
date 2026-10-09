import { Inject, Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { WifiConnection } from '../../../domain/wifi-connection.js';
import { StoreOrmEntity } from '../store.orm-entity.js';
import { WifiConnectionOrmEntity } from '../wifi-connection.orm-entity.js';
import { DEMO_STORES, generateDemoConnections } from './demo-data.js';

// carga inicial no boot, direto no banco sem passar pela fila (o fluxo completo é testado com o scripts/simulate-connections.mjs)
@Injectable()
export class DemoDataSeed implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoDataSeed.name);

  constructor(
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(ConfigService) private readonly config: ConfigService,
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
    const connections = generateDemoConnections(count).map((props) => WifiConnection.create(props));
    const visitors = new Map(connections.map(({ visitor }) => [visitor.phone.e164, visitor]));

    // insert em lote numa transação: um save por conexão no Neon demorava e o Render derrubava o boot no meio
    await this.dataSource.transaction(async (manager) => {
      const visitorIds = new Map<string, string>();
      for (const batch of chunk([...visitors.values()], BATCH_SIZE)) {
        const rows: Array<{ id: string; phone: string }> = await manager.query(
          `INSERT INTO visitors (phone, cpf, name, email)
           VALUES ${placeholders(batch.length, 4)}
           ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
           RETURNING id, phone`,
          batch.flatMap((v) => [v.phone.e164, v.cpf?.digits ?? null, v.name, v.email]),
        );
        for (const row of rows) visitorIds.set(row.phone, row.id);
      }

      for (const batch of chunk(connections, BATCH_SIZE)) {
        await manager.query(
          `INSERT INTO wifi_connections
             (id, store_id, visitor_id, mac_address, device_type, device_os, connected_at)
           VALUES ${placeholders(batch.length, 7)}
           ON CONFLICT (id) DO NOTHING`,
          batch.flatMap((c) => [
            c.id,
            c.storeId,
            visitorIds.get(c.visitor.phone.e164),
            c.device.macAddress,
            c.device.type,
            c.device.os,
            c.connectedAt,
          ]),
        );
      }
    });
    this.logger.log(`${count} conexões de exemplo criadas em ${Date.now() - started}ms`);
  }
}

const BATCH_SIZE = 1000;

function chunk<T>(list: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(list.length / size) }, (_, i) =>
    list.slice(i * size, (i + 1) * size),
  );
}

// gera "($1, $2), ($3, $4)..." pro insert de várias linhas
function placeholders(rows: number, columns: number): string {
  return Array.from(
    { length: rows },
    (_, row) =>
      `(${Array.from({ length: columns }, (_, col) => `$${row * columns + col + 1}`).join(', ')})`,
  ).join(', ');
}
