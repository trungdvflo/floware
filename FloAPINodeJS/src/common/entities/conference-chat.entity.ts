import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_CHAT } from '../constants';
import { VARBINARY_STRING_TRANSFORMER } from '../transformers/varbinary-string.transformer';
import { DateCommon } from './date-common.entity';

@Index('idx_user_id', ['user_id'], {})
@Entity({ name: TABLE_CHAT })
export class ConferenceChatEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column("bigint", { name: 'parent_id', width: 20, nullable: false })
  parent_id: number;

  @Column("bigint", { name: 'conference_member_id', width: 20, nullable: false })
  conference_member_id: number;

  @Column('varchar', { name: 'email', length: 255 })
  email: string;

  @Column("varbinary", {
      name: 'message_uid',
      length: 1000,
      nullable: false,
      transformer: VARBINARY_STRING_TRANSFORMER
  })
  message_uid: string;

  @Column("text", { name: 'message_text', nullable: false })
  message_text: string;

  @Column('tinyint', { name:'message_type', width: 1, default: 0, nullable: false})
  message_type: number;
}