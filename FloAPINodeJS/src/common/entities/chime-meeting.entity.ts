import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'chime_meeting' })
export class ChimeMeetingEntity {
    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;

    @Column("varchar", { name: 'meeting_id', length: 50 })
    meeting_id: string;

    @Column("int", { name: 'channel_id', width: 11 })
    channel_id: number;

    @Column("varchar", { name: 'external_meeting_id', length: 100 })
    external_meeting_id: string;

    @Column("varchar", { name: 'external_meeting_type', length: 20 })
    external_meeting_type: string;

    @Column("int", { name: 'start_time', width: 11 })
    start_time: number;

    @Column("int", { name: 'end_time', width: 11 })
    end_time: number;

    @Column("int", { name: 'spend_time', width: 11 })
    spend_time: number;
}