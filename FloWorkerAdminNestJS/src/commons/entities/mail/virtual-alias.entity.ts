import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('virtual_alias')
export class VirtualAlias {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('varchar', { length: 100 })
  source: string;
}
