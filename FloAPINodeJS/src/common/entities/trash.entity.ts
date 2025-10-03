import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { VARBINARY_STRING_TRANSFORMER } from '../transformers/varbinary-string.transformer';

@Index('obj_id', ['object_uid'], {})
@Index('obj_type', ['object_type', 'user_id'], {})
@Index('user_id', ['user_id'], {})
@Entity('trash_collection')
export class TrashEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('int', { name: 'user_id', unsigned: true })
  user_id: number;

  @Column('bigint', { name: 'object_id', unsigned: true })
  object_id: number;
  @Column('varbinary', {
    name: 'object_uid',
    nullable: true,
    length: 1000,
    // transformer: VARBINARY_STRING_TRANSFORMER
  })
  object_uid: Buffer;

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

  @Column('double', { name: 'created_date', precision: 13, scale: 3 })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    nullable: true,
    precision: 13,
    scale: 3,
  })
  updated_date: number | null;

  @Column('int', {
    name: 'sync_token'
    , nullable: true
    , select: false
    , default: 0 })
  sync_token: number | null;

  @Column('int', {
    name: 'status'
    , select: false
    , default: 1 })
  status: number;

  @Column('double', {
    name: 'trash_time',
    precision: 13,
    scale: 3,
    default: () => '\'0.000\'',
  })
  trash_time: number;

  email?: string;
}
