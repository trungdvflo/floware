import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('kanban_card')
export class KanbanCard {
  @PrimaryColumn('bigint', { type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
  })
  user_id: number;

  @Column('varbinary', {
    name: 'object_uid',
    length: 1000
  })
  object_uid: Buffer;

  @Column('varbinary', {
    name: 'object_type',
    length: 50,
  })
  object_type: Buffer;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3
  })
  updated_date: number | null;

  @Column('int', {
    name: 'item_card_order',
    width: 11,
    default: 0
  })
  item_card_order: number;

  @Column('bigint', {
    name: 'kanban_id',
    width: 20,
  })
  kanban_id: number;

  @Column('int', {
    name: 'account_id',
    width: 11,
    default: 0,
  })
  account_id: number;

  @Column('decimal', {
    name: 'order_number',
    precision: 20,
    scale: 10,
    nullable: true,
    default: 0.0
  })
  order_number: number;

  @Column('double', {
    name: 'order_update_time',
    precision: 13,
    scale: 3,
    nullable: true,
    default: null,
  })
  order_update_time: number | null;

  @Column('text', {
    name: 'object_href',
  })
  object_href: string;

  @Column('tinyint', {
    name: 'is_trashed',
    width: 1,
    default: 0,
  })
  is_trashed: number;

  @Column('double', {
    name: 'recent_date',
    precision: 13,
    scale: 3,
    nullable: false,
    default: 0,
  })
  recent_date: number;
}
