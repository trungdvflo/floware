import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { VARBINARY_STRING_TRANSFORMER } from '../utils/varbinary-string.transformer';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.LINKED_OBJ })
export class LinkedObjectEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('varbinary', {
    name: 'source_object_uid',
    length: 1000,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  source_object_uid: Buffer;

  @Column('varbinary', {
    name: 'source_object_type',
    length: 50,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  source_object_type: string;

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
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  destination_object_uid?: Buffer;

  @Column('varbinary', {
    name: 'destination_object_type',
    length: 50,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  destination_object_type: string;

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
