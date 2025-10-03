import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_HISTORY } from '../../common/constants';
import { GENERAL_OBJ } from '../../common/dtos/object-uid';
import { DateCommon } from '../../common/entities/date-common.entity';
import { EmailDTO } from '../dtos/email.dto';

@Index('idx_user_id', ['user_id'], {})
@Index('idx_email', ['email'], {})
@Index('idx_activity_id', ['collection_activity_id'], {})
@Index('idx_updated_date', ['updated_date'], {})
@Entity({ name: TABLE_HISTORY })
export class CollectionHistory extends DateCommon {
    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;
    @Column("bigint", { name: 'collection_activity_id', width: 20, nullable: false })
    collection_activity_id: number;
    @Column("bigint", { name: 'user_id', width: 20, nullable: false })
    user_id: number;
    @Column("varchar", { name: 'email', length: 255, nullable: false })
    email: string;
    @Column("text", { name: 'content', nullable: false })
    content: string;
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
    @Column("text", { name: 'assignees', nullable: false })
    assignees: EmailDTO[] | string;

    owner_calendar_uri?: string;
    member_calendar_uri?: string;
    owner_username?: string;
    member_email?: string;
    owner_user_id?: number;
    member_user_id?: number;
}