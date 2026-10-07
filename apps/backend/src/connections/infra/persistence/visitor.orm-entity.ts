import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'visitors' })
export class VisitorOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // TODO: criptografar em repouso (LGPD). Por enquanto só não sai da API sem máscara.
  @Column({ type: 'char', length: 11, unique: true })
  cpf: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
