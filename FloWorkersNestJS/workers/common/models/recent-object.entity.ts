import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { VARBINARY_STRING_TRANSFORMER } from '../utils/varbinary-string.transformer';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.RECENT_OBJ})
export class RecentObjectEntity extends CommonEntity{
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
}
