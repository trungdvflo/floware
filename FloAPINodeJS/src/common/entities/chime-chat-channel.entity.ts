import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('idx_user_id', ['user_id'], {})
@Entity({ name: 'chime_chat_channel' })
export class ChimeChatChannelEntity {
    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;

    @Column("bigint", { name: 'user_id', width: 20, nullable: false })
    user_id: number;

    @Column("bigint", { name: 'internal_channel_id', width: 20, nullable: false })
    internal_channel_id: number;

    @Column("varchar", { name: 'channel_arn', length: 2000, nullable: false })
    channel_arn: string;

    @Column("int", { name: 'internal_channel_type', width: 1, nullable: false })
    internal_channel_type: number;

    @Column('double', { name: 'created_date', precision: 13, scale: 3, nullable: false })
    created_date: number;

    @Column('double', { name: 'updated_date', precision: 13, scale: 3, nullable: false })
    updated_date: number;

}