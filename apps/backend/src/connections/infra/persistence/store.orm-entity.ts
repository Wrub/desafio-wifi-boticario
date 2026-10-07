import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity({ name: 'stores' })
export class StoreOrmEntity {
  // slug legível (ex.: loja-centro), facilita no simulador e nos logs
  @PrimaryColumn({ type: 'varchar', length: 64 })
  id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 80 })
  city: string;
}
