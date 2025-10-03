import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { TABLE_ICON } from '../constants';

@Index('unq_shortcut', ['shortcut'], {})
@Entity({ name: TABLE_ICON })
export class CollectionIcon {
    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;
    @Column("varchar", { name: 'shortcut', length: 255, nullable: false })
    shortcut: string;
    @Column("text", { name: 'cdn_url', nullable: false })
    cdn_url: string;
    @Column("tinyint", { name: 'icon_type', width: 1, nullable: false })
    icon_type: number;
    @Column("varchar", { name: 'description', length: 255, nullable: false })
    description: string;
    @Column('double', { name: 'created_date', precision: 13, scale: 3, nullable: false })
    created_date: number;
    @Column('double', { name: 'updated_date', precision: 13, scale: 3, nullable: false })
    updated_date: number;
}