import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { GENERAL_OBJ } from '../constants';
import { DateCommon } from './date-common.entity';

@Index('idx_user_id', ['user_id'], {})
@Index('idx_email', ['email'], {})
@Index('idx_activity_id', ['collection_activity_id'], {})
@Index('idx_updated_date', ['updated_date'], {})
@Entity({ name: 'collection_comment' })
export class CollectionComment extends DateCommon{
    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;
    @Column("bigint", { name: 'collection_activity_id', width: 20, nullable: false })
    collection_activity_id: number;
    @Column("bigint", { name: 'user_id', width: 20, nullable: false })
    user_id: number;
    @Column("varchar", { name: 'email', length: 255, nullable: false })
    email: string;
    @Column("text", { name: 'comment', nullable: false })
    comment: string;
    @Column("bigint", { name: 'parent_id', width: 20, nullable: false })
    parent_id: number;
    @Column("tinyint", { name: 'action', width: 1, nullable: false })
    action: number;
    @Column('double', { name: 'action_time', precision: 13, scale: 3, nullable: false })
    action_time: number;

    @Column("bigint", { name: 'collection_id', width: 20, nullable: false })
    collection_id: number;
    @Column("varbinary", { name: 'object_uid', length: 1000, nullable: false })
    object_uid: Buffer | string;
    @Column("varbinary", { name: 'object_type', length: 50, nullable: false })
    object_type: GENERAL_OBJ | string;
    @Column("text", { name: 'object_href', nullable: false })
    object_href: string;

}