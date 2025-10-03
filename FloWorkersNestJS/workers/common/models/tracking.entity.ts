import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { VARBINARY_STRING_TRANSFORMER } from "../utils/varbinary-string.transformer";
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.TRASH_COLLECTION})
export class TrackingEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('bigint', {
    name: 'account_id',
    width: 20,
    default: 0
  })
  account_id: number;

  @Column('varbinary', {
    name: 'object_uid',
    length: 1000
  })
  object_uid: Buffer;

  @Column('varbinary', {
    name: 'object_type',
    length: 50,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_type: string;

}