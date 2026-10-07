import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { StoreOrmEntity } from './store.orm-entity.js';
import { VisitorOrmEntity } from './visitor.orm-entity.js';

// Formato do banco. Separado da entidade de domínio pra não espalhar decorator do TypeORM por lá.
@Entity({ name: 'wifi_connections' })
@Index('idx_wifi_connections_store_connected_at', ['storeId', 'connectedAt'])
@Index('idx_wifi_connections_visitor', ['visitorId'])
export class WifiConnectionOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ name: 'store_id', type: 'varchar', length: 64 })
  storeId: string;

  @ManyToOne(() => StoreOrmEntity)
  @JoinColumn({ name: 'store_id' })
  store?: StoreOrmEntity;

  @Column({ name: 'visitor_id', type: 'uuid' })
  visitorId: string;

  @ManyToOne(() => VisitorOrmEntity)
  @JoinColumn({ name: 'visitor_id' })
  visitor?: VisitorOrmEntity;

  @Column({ name: 'mac_address', type: 'varchar', length: 17 })
  macAddress: string;

  @Column({ name: 'device_type', type: 'varchar', length: 20 })
  deviceType: string;

  @Column({ name: 'device_os', type: 'varchar', length: 40, nullable: true })
  deviceOs: string | null;

  @Column({ name: 'connected_at', type: 'timestamptz' })
  connectedAt: Date;

  @CreateDateColumn({ name: 'received_at', type: 'timestamptz' })
  receivedAt: Date;
}
