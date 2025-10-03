import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { VARBINARY_STRING_TRANSFORMER } from '../utils/varbinary-string.transformer';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.SORT_OBJ})
export class SortObjectEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('varbinary', {
    length: 1000,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_uid: Buffer;

  @Column('varchar', {
    length: 50,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_type: string;

  @Column('text', {
    nullable: true,
    default: null,
  })
  object_href: string;

  @Column('decimal', {
    precision: 20,
    scale: 10,
  })
  order_number: number;

  @Column('bigint', {
    name: 'account_id',
    width: 20,
    default: 0
  })
  account_id: number;

  @Column('double', {
    name: 'order_update_time',
    precision: 13,
    scale: 3,
    default: 0
  })
  order_update_time: number;

  @Column('bigint', {
    name: 'user_id',
  })
  user_id: number;
}
