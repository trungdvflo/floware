import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'protect_page', synchronize: true })
export class ProtectPageEntity {
    @PrimaryGeneratedColumn('increment', { name: 'id' })
    id: number;
    @Column("text", { name: 'verify_code' })
    verify_code: string;
    @Column("integer", { name: 'time_code_expire' })
    time_code_expire: number;
    @Column('double', { name: 'created_date', precision: 13, scale: 3, nullable: false })
    created_date: number;
    @Column('double', { name: 'updated_date', precision: 13, scale: 3, nullable: false })
    updated_date: number;
    @Column('varchar', { name: 'checksum', length: 255, nullable: false })
    checksum: number;
}