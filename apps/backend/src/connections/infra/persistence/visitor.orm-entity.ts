import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'visitors' })
export class VisitorOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // chave do visitante, formato +5541999998888
  @Column({ type: 'varchar', length: 14, unique: true })
  phone: string;

  // opcional e sem unique: a pessoa pode trocar de número e manter o CPF
  // TODO: criptografar em repouso (LGPD). Por enquanto só não sai da API sem máscara.
  @Index('idx_visitors_cpf')
  @Column({ type: 'char', length: 11, nullable: true })
  cpf: string | null;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 160 })
  email: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
