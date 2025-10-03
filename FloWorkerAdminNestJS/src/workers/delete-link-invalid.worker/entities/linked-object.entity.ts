import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('linked_object')
export class LinkedObject {
  @PrimaryColumn('bigint', { type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('bigint', {
    name: 'user_id',
    width: 20,
    nullable: false,
  })
  user_id: number;

  @Column('varbinary', {
    name: 'source_object_uid',
    length: 1000,
    nullable: false
  })
  source_object_uid: Buffer;

  @Column('varbinary', {
    name: 'source_object_type',
    length: 50,
    nullable: false,
  })
  source_object_type: Buffer;

  @Column('bigint', {
    name: 'source_account_id',
    width: 20,
    nullable: false,
    default: 0,
  })
  source_account_id: number | 0;

  @Column('text', {
    name: 'source_object_href',
    nullable: true,
    default: null,
  })
  source_object_href: string | null;

  @Column('varbinary', {
    name: 'destination_object_uid',
    length: 1000,
    nullable: false,
  })
  destination_object_uid?: Buffer;

  @Column('varbinary', {
    name: 'destination_object_type',
    length: 50,
    nullable: false,
  })
  destination_object_type: Buffer;

  @Column('bigint', {
    name: 'destination_account_id',
    width: 20,
    nullable: false,
    default: 0,
  })
  destination_account_id: number | 0;

  @Column('text', {
    name: 'destination_object_href',
    nullable: true,
    default: null,
  })
  destination_object_href: string | null;

  @Column('tinyint', {
    name: 'is_trashed',
    nullable: false,
    default: 0,
  })
  is_trashed: number | 0;
}
