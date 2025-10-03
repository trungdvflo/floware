import { Column, Entity, Index, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Index('idx_user_id', ['user_id'], {})
@Index('uniq_on_user_id_and_tracking_app_id', ['user_id', 'tracking_app_id'], {})
@Entity('user_tracking_app')
export class UserTrackingApp extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
    id: number;
    @Column('bigint', { width: 20 })
    user_id: number;
    @Column('bigint', { width: 20 })
    tracking_app_id: number;
    @Column('double', { precision: 13, scale: 3 })
    last_used_date: number;
    @Column('double', { precision: 13, scale: 3 })
    created_date: number;
    @Column('double', { precision: 13, scale: 3 })
    updated_date: number;
}
