import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LINK_OBJ_TYPE } from '../dtos/object-uid';
import { VARBINARY_STRING_TRANSFORMER } from "../transformers/varbinary-string.transformer";
import { DateCommon } from './date-common.entity';
@Entity('linked_object')
export class LinkedObject extends DateCommon {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('bigint', {
    name: 'user_id',
    select: false,
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
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  source_object_type: LINK_OBJ_TYPE;

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
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  destination_object_type: LINK_OBJ_TYPE;

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
