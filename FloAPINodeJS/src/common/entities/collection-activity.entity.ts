import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_ACTIVITY } from '../../common/constants';
import { DateCommon } from '../../common/entities/date-common.entity';
@Index('idx_user_id', ['user_id'], {})
@Index('idx_collection_id', ['collection_id'], {})
@Index('idx_updated_date', ['updated_date'], {})
@Index('idx_on_collection_id and_object_uid', ['collection_id', 'object_uid'], {})
@Entity({ name: TABLE_ACTIVITY })
export class CollectionActivity extends DateCommon {
    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;
    @Column("bigint", { name: 'collection_id', width: 20, nullable: false })
    collection_id: number;
    @Column("bigint", { name: 'user_id', width: 20, nullable: false })
    user_id: number;
    @Column("varbinary", { name: 'object_uid', length: 1000, nullable: false })
    object_uid: Buffer | string;
    @Column("varbinary", { name: 'object_type', length: 50, nullable: false })
    object_type: string;
    @Column("text", { name: 'object_href', nullable: false })
    object_href: string;
}