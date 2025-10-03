import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_CHANNEL } from '../constants/mysql.func';

@Index('idx_user_id', ['user_id'], {})
@Entity({ name: TABLE_CHANNEL })
export class ConferenceChannelEntity {
    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;

    @Column("bigint", { name: 'user_id', width: 20, nullable: false })
    user_id: number;

    @Column('varchar', { name: 'title', length: 2000 })
    title: string;

    @Column('varchar', { name: 'realtime_channel', length: 200 })
    realtime_channel: string;

    @Column("varchar", { name: 'room_url', length: 2000, nullable: false })
    room_url: string;

    @Column("varchar", { name: 'channel_arn', length: 2000, nullable: true })
    channel_arn: string;

    @Column('double', { name: 'created_date', precision: 13, scale: 3, nullable: false })
    created_date: number;

    @Column('double', { name: 'updated_date', precision: 13, scale: 3, nullable: false })
    updated_date: number;

    @Column('double', { name: 'last_used', precision: 13, scale: 3, nullable: false })
    last_used: number;

    @Column('double', { name: 'revoke_time', precision: 13, scale: 3 })
    revoke_time: number;
}