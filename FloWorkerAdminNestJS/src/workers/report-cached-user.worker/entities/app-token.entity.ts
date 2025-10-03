import { Column, Entity, Index, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Index('idx_user_id', ['user_id'], { unique: true })
@Index('idx_key_api', ['key_api'], { unique: true })
@Entity('app_token')
export class AppToken extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('varchar', { length: 255 })
  app_preg_id: string;

  @Column('varchar', { length: 255 })
  key_api: string;

  @Column('varchar', { length: 255 })
  token: string;

  @Column('bigint', { width: 20 })
  user_id: number;

  @Column('varchar', { length: 255 })
  email: string;

  @Column('double', { precision: 13, scale: 3 })
  time_expire: number;

  @Column('double', { precision: 13, scale: 3 })
  created_time: number;
}
