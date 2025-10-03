import { CHIME_CHAT_CHANNEL_MEMBER_TABLE_NAME } from 'configs/typeorm.util';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: CHIME_CHAT_CHANNEL_MEMBER_TABLE_NAME })
export class ChimeChatChannelMemberEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column("bigint", { name: 'channel_id', width: 20, nullable: false })
  channel_id: number;

  @Column("bigint", { name: 'member_id', width: 20, nullable: false })
  member_id: number;

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
}
