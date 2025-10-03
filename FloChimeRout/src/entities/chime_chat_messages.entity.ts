import { CHIME_CHAT_MESSAGES_TABLE_NAME } from 'configs/typeorm.util';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: CHIME_CHAT_MESSAGES_TABLE_NAME })
export class ChimeChatMessagesEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column('bigint', { name: 'user_id', width: 20, nullable: false })
  user_id: number;

  @Column('bigint', { name: 'channel_id', width: 20, nullable: false })
  channel_id: number;

  @Column('varchar', { name: 'internal_message_uid', length: 2000 })
  internal_message_uid: string;

  @Column('tinyint', {
    name: 'is_deleted',
    width: 1,
    default: 0,
    nullable: false,
  })
  is_deleted: number;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    nullable: false,
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: false,
  })
  updated_date: number;

  @Column('double', {
    name: 'migrate_time',
    precision: 13,
    scale: 3,
    nullable: false,
  })
  migrate_time: number;
}
