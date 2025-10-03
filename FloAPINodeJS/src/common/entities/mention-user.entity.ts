import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_MENTION_USER } from '../constants';
import { DateCommon } from './date-common.entity';

@Index('idx_user_id', ['user_id'], {})
@Index('idx_comment_id', ['comment_id'], {})
@Index('idx_updated_date', ['updated_date'], {})
@Entity({ name: TABLE_MENTION_USER })
export class MentionUser extends DateCommon {
    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;
    @Column("bigint", { name: 'comment_id', width: 20, nullable: false })
    comment_id: number;
    @Column("varchar", { name: 'email', length: 255, nullable: false })
    email: string;
    @Column("text", { name: 'mention_text', nullable: false })
    mention_text: string;
}