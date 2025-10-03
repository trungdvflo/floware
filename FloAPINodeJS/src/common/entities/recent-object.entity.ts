import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { OBJ_TYPE } from '../constants';
import { VARBINARY_STRING_TRANSFORMER } from '../transformers/varbinary-string.transformer';
import { DateCommon } from './date-common.entity';

@Entity({ name: 'recent_object' })
export class RecentObject extends DateCommon {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('bigint', {
    width: 20,
    nullable: false,
    select: false
  })
  user_id: number;

  @Column('bigint', {
    width: 20,
    nullable: false,
    default: 0
  })
  account_id: number;

  @Column('varbinary', {
    length: 1000,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_uid: string;

  @Column('varchar', {
    length: 50,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_type: OBJ_TYPE.VCARD | OBJ_TYPE.VJOURNAL;

  @Column('text', {
    nullable: true,
    default: null,
  })
  object_href: string;

  @Column('double', {
    name: 'recent_date',
    precision: 13,
    scale: 3,
    default: 0,
    nullable: true
  })
  recent_date: number;
}
