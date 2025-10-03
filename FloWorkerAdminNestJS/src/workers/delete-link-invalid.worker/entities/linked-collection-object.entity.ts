import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('linked_collection_object')
export class LinkedCollectionObject {
  @PrimaryColumn('bigint', { type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
    nullable: false,
  })
  user_id: number;

  @Column('bigint', {
    name: 'collection_id',
    width: 20,
    nullable: false,
  })
  collection_id: number;

  @Column('varbinary', {
    name: 'object_uid',
    length: 1000,
    nullable: false
  })
  object_uid?: Buffer;

  @Column('varbinary', {
    name: 'object_type',
    length: 50,
    nullable: false,
  })
  object_type: Buffer;

  @Column('bigint', {
    name: 'account_id',
    width: 20,
    nullable: false,
    default: 0,
  })
  account_id: number | 0;

  @Column('text', {
    name: 'object_href',
    nullable: true,
    default: null,
  })
  object_href: string | null;

  @Column('tinyint', {
    name: 'is_trashed',
    nullable: false,
    default: 0,
  })
  is_trashed: number | 0;

  @Column('double', {
    name: 'email_time',
    precision: 13,
    scale: 3,
    default: 0
  })
  email_time: number;
}
