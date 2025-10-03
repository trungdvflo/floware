import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { VARBINARY_STRING_TRANSFORMER } from '../utils/varbinary-string.transformer';
import { CommonEntity } from './common.entity';

@Entity({ name: 'collection_notification' })
export class CollectionNotificationEntity extends CommonEntity {
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
  object_type: string;

  @Column('int', {
    name: 'action'
  })
  action: number;

  @Column('double', {
    name: 'action_time',
    precision: 13,
    scale: 3,
    nullable: false
  })
  action_time: number;

  @Column('varchar', {
    name: 'content',
    length: 1000
  })
  content: string;
}