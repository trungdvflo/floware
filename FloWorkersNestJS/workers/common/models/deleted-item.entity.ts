import {
  Column, Entity, PrimaryGeneratedColumn
} from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { VARBINARY_STRING_TRANSFORMER } from '../utils/varbinary-string.transformer';
import { CommonEntity } from './common.entity';
@Entity({ name: NAME_ENTITY.DELETE_ITEM })
export class DeletedItemEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('bigint', {
    name: 'item_id',
    width: 20,
  })
  item_id: number;

  @Column('varbinary', {
    name: 'item_uid',
    length: 1000,
    nullable: true,
    transformer: VARBINARY_STRING_TRANSFORMER,
  })
  item_uid: string;

  @Column('varbinary', {
    name: 'item_type',
    length: 50,
    nullable: false,
    transformer: VARBINARY_STRING_TRANSFORMER,
  })
  item_type: string;

  @Column('tinyint', {
    name: 'is_recovery',
    width: 1,
    default: 0
  })
  is_recovery: boolean;
}
