import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('user_id_and_email', ['email'], {})
@Entity('admin')
export class Admin {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('varchar', { length: 255 })
  email: string;

  @Column('varchar', { length: 255 })
  verify_code: string;

  @Column('int', { width: 11, default: 0 })
  time_code_expire: number;

  @Column('tinyint', { width: 4, default: 0 })
  role: number;

  @Column('double', { precision: 13, scale: 3, default: () => 0 })
  created_date: number;

  @Column('double', { precision: 13, scale: 3, nullable: true, default: null })
  updated_date: number | null;
}
