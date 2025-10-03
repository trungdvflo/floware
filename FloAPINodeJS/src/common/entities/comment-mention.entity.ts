import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_MENTION } from '../constants';
import { DateCommon } from './date-common.entity';

@Index('idx_user_id', ['user_id'], {})
@Index('idx_comment_id', ['comment_id'], {})
@Index('idx_updated_date', ['updated_date'], {})
@Entity({ name: TABLE_MENTION })
export class CommentMention extends DateCommon {
    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;
    @Column("bigint", { name: 'comment_id', width: 20, nullable: false })
    comment_id: number;
    @Column("bigint", { name: 'comment_id', width: 20, nullable: false })
    mention_user_id: number;
}