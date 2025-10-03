import { Column, Entity, Index, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Index('idx_on_name_and_app_version', ['name', 'app_version'], {})
@Entity('tracking_app')
export class TrackingApp extends BaseEntity {
    @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
    id: number;
    @Column('varchar', { length: 255 })
    name: string;
    @Column('varchar', { length: 255 })
    app_version: string;
    @Column('varchar', { length: 255 })
    flo_version: string;
    @Column('varchar', { length: 45 })
    build_number: string;
    @Column('double', { precision: 13, scale: 3 })
    created_date: number;
    @Column('double', { precision: 13, scale: 3 })
    updated_date: number;
}
