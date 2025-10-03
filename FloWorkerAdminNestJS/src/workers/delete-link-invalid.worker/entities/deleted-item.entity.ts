import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('deleted_item')
export class DeletedItem {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint'
  })
  id: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
  })
  user_id: number;

  @Column('bigint', {
    name: 'item_id',
    width: 20,
  })
  item_id: number;

  @Column('varbinary', {
    name: 'item_uid',
    length: 1000,
    nullable: true,
  })
  item_uid: Buffer;

  @Column('varbinary', {
    name: 'item_type',
    length: 50,
    nullable: false,
  })
  item_type: string;

  @Column('tinyint', {
    name: 'is_recovery',
    width: 1,
    default: 0,
  })
  is_recovery: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    default: () => 0,
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  updated_date: number | null;
}
