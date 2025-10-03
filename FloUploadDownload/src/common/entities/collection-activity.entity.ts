import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { LINK_OBJ_TYPE } from '../constants';
import { VARBINARY_STRING_TRANSFORMER } from '../transformers/varbinary-string.transformer';
import { DateCommon } from './date-common.entity';

@Entity({ name: 'collection_activity' })
export class CollectionActivity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column('bigint', {
    name: 'collection_id',
    width: 20
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
  object_type: LINK_OBJ_TYPE;

  @Column('text', {
    name: 'object_href',
    nullable: true,
    default: null,
  })
  object_href: string | null;
}