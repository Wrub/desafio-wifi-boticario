import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { MetricsPeriod } from '../../application/period.js';
import {
  STORE_TIME_ZONE,
  type ConnectionRepository,
  type Pagination,
  type StoreVisitorRow,
  type StoreVisitorsFilter,
  type StoreWithMetrics,
  type VisitsCounts,
  type VisitsFilter,
  type VisitsSummary,
} from '../../application/ports/connection.repository.js';
import type { DeviceType } from '../../domain/device.js';
import { WifiConnection } from '../../domain/wifi-connection.js';
import { StoreOrmEntity } from './store.orm-entity.js';

// Usei SQL direto nas consultas de métrica porque fica bem mais legível que o query builder.
@Injectable()
export class TypeOrmConnectionRepository implements ConnectionRepository {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  storeExists(storeId: string): Promise<boolean> {
    return this.dataSource.getRepository(StoreOrmEntity).exists({ where: { id: storeId } });
  }

  async listStoresWithMetrics({ from, to }: MetricsPeriod): Promise<StoreWithMetrics[]> {
    // LEFT JOIN com o filtro de data no ON, senão loja sem visita some da lista
    const rows: Array<{
      id: string;
      name: string;
      city: string;
      total_visits: string;
      unique_visitors: string;
    }> = await this.dataSource.query(
      `SELECT s.id, s.name, s.city,
              COUNT(c.id) AS total_visits,
              COUNT(DISTINCT c.visitor_id) AS unique_visitors
       FROM stores s
       LEFT JOIN wifi_connections c
         ON c.store_id = s.id AND c.connected_at BETWEEN $1 AND $2
       GROUP BY s.id, s.name, s.city
       ORDER BY total_visits DESC, s.name`,
      [from, to],
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      city: row.city,
      totalVisits: Number(row.total_visits),
      uniqueVisitors: Number(row.unique_visitors),
    }));
  }

  async save(connection: WifiConnection): Promise<void> {
    const { visitor, device } = connection;

    await this.dataSource.transaction(async (manager) => {
      const [{ id: visitorId }] = await manager.query(
        `INSERT INTO visitors (phone, cpf, name, email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (phone) DO UPDATE
           SET name = EXCLUDED.name, email = EXCLUDED.email,
               cpf = COALESCE(EXCLUDED.cpf, visitors.cpf), updated_at = now()
         RETURNING id`,
        [visitor.phone.e164, visitor.cpf?.digits ?? null, visitor.name, visitor.email],
      );

      // ON CONFLICT DO NOTHING -> mensagem repetida da fila não duplica conexão
      await manager.query(
        `INSERT INTO wifi_connections
           (id, store_id, visitor_id, mac_address, device_type, device_os, connected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          connection.id,
          connection.storeId,
          visitorId,
          device.macAddress,
          device.type,
          device.os,
          connection.connectedAt,
        ],
      );
    });
  }

  async getVisitsSummary({ from, to, storeId }: VisitsFilter): Promise<VisitsSummary> {
    // visitante único = pessoa (CPF), não aparelho. Uma pessoa com celular e notebook conta 1.
    const [row] = await this.dataSource.query(
      `SELECT COUNT(*) AS total_visits, COUNT(DISTINCT visitor_id) AS unique_visitors
       FROM wifi_connections
       WHERE connected_at BETWEEN $1 AND $2
         AND ($3::varchar IS NULL OR store_id = $3)`,
      [from, to, storeId ?? null],
    );

    // COUNT no Postgres volta como string (bigint)
    return {
      totalVisits: Number(row?.total_visits ?? 0),
      uniqueVisitors: Number(row?.unique_visitors ?? 0),
    };
  }

  async countVisitsByTime({ from, to, storeId }: VisitsFilter): Promise<VisitsCounts> {
    // o banco guarda em UTC: sem o AT TIME ZONE, o pico das 18h apareceria às 21h
    const rows: Array<{ kind: 'weekday' | 'hour' | 'month'; key: number; visits: string }> =
      await this.dataSource.query(
        `WITH local AS (
           SELECT connected_at AT TIME ZONE $4 AS t
           FROM wifi_connections
           WHERE connected_at BETWEEN $1 AND $2
             AND ($3::varchar IS NULL OR store_id = $3)
         )
         SELECT 'weekday' AS kind, EXTRACT(DOW FROM t)::int AS key, COUNT(*) AS visits
         FROM local GROUP BY 2
         UNION ALL
         SELECT 'hour', EXTRACT(HOUR FROM t)::int, COUNT(*) FROM local GROUP BY 2
         UNION ALL
         SELECT 'month', EXTRACT(MONTH FROM t)::int, COUNT(*) FROM local GROUP BY 2`,
        [from, to, storeId ?? null, STORE_TIME_ZONE],
      );

    const counts: VisitsCounts = { byWeekday: new Map(), byHour: new Map(), byMonth: new Map() };
    const maps = { weekday: counts.byWeekday, hour: counts.byHour, month: counts.byMonth };
    for (const row of rows) {
      maps[row.kind].set(Number(row.key), Number(row.visits));
    }
    return counts;
  }

  async listStoreVisitors(
    { storeId, from, to, search }: StoreVisitorsFilter,
    { page, pageSize }: Pagination,
  ): Promise<{ items: StoreVisitorRow[]; total: number }> {
    // escapo % e _ pra o texto digitado não virar curinga do LIKE
    const pattern = search ? `%${search.replace(/[\\%_]/g, '\\$&')}%` : null;

    // $1 loja, $2/$3 período, $4 busca (null = sem filtro)
    const matchingVisits = `
      SELECT c.visitor_id, COUNT(*) AS visits, MAX(c.connected_at) AS last_connected_at,
             ARRAY_AGG(c.connected_at ORDER BY c.connected_at) AS visit_times
      FROM wifi_connections c
      JOIN visitors v ON v.id = c.visitor_id
      WHERE c.store_id = $1 AND c.connected_at BETWEEN $2 AND $3
        AND ($4::text IS NULL OR v.name ILIKE $4 OR v.email ILIKE $4)
      GROUP BY c.visitor_id`;

    const [countRow] = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM (${matchingVisits}) matching`,
      [storeId, from, to, pattern],
    );

    // pego o último aparelho que a pessoa usou nessa loja (LATERAL)
    const rows: Array<{
      visitor_id: string;
      name: string;
      phone: string;
      cpf: string | null;
      email: string;
      visits: string;
      visit_times: Array<Date | string>;
      last_connected_at: Date;
      mac_address: string;
      device_type: DeviceType;
      device_os: string | null;
    }> = await this.dataSource.query(
      `WITH visits AS (${matchingVisits})
       SELECT v.id AS visitor_id, v.name, v.phone, v.cpf, v.email, vi.visits, vi.visit_times,
              vi.last_connected_at, last.mac_address, last.device_type, last.device_os
       FROM visits vi
       JOIN visitors v ON v.id = vi.visitor_id
       JOIN LATERAL (
         SELECT c.mac_address, c.device_type, c.device_os
         FROM wifi_connections c
         WHERE c.visitor_id = vi.visitor_id AND c.store_id = $1
           AND c.connected_at BETWEEN $2 AND $3
         ORDER BY c.connected_at DESC
         LIMIT 1
       ) last ON true
       ORDER BY vi.last_connected_at DESC
       LIMIT $5 OFFSET $6`,
      [storeId, from, to, pattern, pageSize, (page - 1) * pageSize],
    );

    return {
      total: Number(countRow?.total ?? 0),
      items: rows.map((row) => ({
        visitorId: row.visitor_id,
        name: row.name,
        phone: row.phone,
        cpf: row.cpf,
        email: row.email,
        visits: Number(row.visits),
        visitTimes: row.visit_times.map((time) => new Date(time)),
        lastConnectedAt: new Date(row.last_connected_at),
        lastDevice: {
          macAddress: row.mac_address,
          type: row.device_type,
          os: row.device_os,
        },
      })),
    };
  }
}
