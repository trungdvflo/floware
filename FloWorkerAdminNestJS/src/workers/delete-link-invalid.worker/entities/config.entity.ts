import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('config')
export class Config {
  @PrimaryColumn('bigint', { type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('varchar', {
    name: 'group',
    length: 100,
  })
  group: string;

  @Column('varchar', {
    name: 'key',
    length: 100,
  })
  key: string;

  @Column('varchar', {
    name: 'value',
    length: 100,
  })
  value: string;
}
