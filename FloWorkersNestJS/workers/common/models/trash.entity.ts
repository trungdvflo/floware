import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { VARBINARY_STRING_TRANSFORMER } from '../utils/varbinary-string.transformer';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.TRASH_COLLECTION })
export class TrashEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('varbinary', {
    name: 'object_uid',
    nullable: true,
    length: 1000
  })
  object_uid: Buffer;

  @Column('bigint', {
    name: 'object_id',
    nullable: true,
    width: 20,
  })
  object_id: number | null;

  @Column('varchar', {
    name: 'object_type',
    length: 50,
    transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_type: string;

  @Column('text', {
    name: 'object_href',
  })
  object_href: string | null;

  @Column('int', { name: 'sync_token', nullable: true, default: () => '\'0\'' })
  sync_token: number | null;

  @Column('int', { name: 'status', default: () => '\'1\'' })
  status: number;

  @Column('double', {
    name: 'trash_time',
    precision: 13,
    scale: 3,
    default: () => '\'0.000\'',
  })
  trash_time: number;

  email?: string;

  old_object_uid?: Buffer;
  new_object_uid?: Buffer;
  col_type: number;
}
