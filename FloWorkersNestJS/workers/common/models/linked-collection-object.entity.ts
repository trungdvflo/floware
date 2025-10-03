import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { VARBINARY_STRING_TRANSFORMER } from '../utils/varbinary-string.transformer';
import { CommonEntity } from './common.entity';
@Entity({ name: NAME_ENTITY.LINKED_COLLECTION_OBJ})
export class LinkedCollectionObjectEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

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
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_type: string;

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
}
