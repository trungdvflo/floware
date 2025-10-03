import { TABLE_CHAT } from 'configs/typeorm.util';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('idx_user_id', ['user_id'], {})
@Entity({ name: TABLE_CHAT })
export class ConferenceChat {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column('bigint', { name: 'user_id', width: 20, nullable: false })
  user_id: number;

  @Column('bigint', { name: 'parent_id', width: 20, nullable: false })
  parent_id: number;

  @Column('bigint', {
    name: 'conference_member_id',
    width: 20,
    nullable: false,
  })
  conference_member_id: number;

  @Column('varbinary', { name: 'email', length: 1000 })
  email: string;

  @Column('varbinary', { name: 'message_uid', length: 1000, nullable: false })
  message_uid: string;

  @Column('text', { name: 'message_text', nullable: false })
  message_text: string;

  @Column('tinyint', {
    name: 'message_type',
    width: 1,
    default: 0,
    nullable: false,
  })
  message_type: number;

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
