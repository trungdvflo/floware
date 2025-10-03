import { Column, Entity, Index, PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

@Index('uniq_user_id', ['user_id'], {})
@Index('uniq_username', ['username'], {})
@Index('idx_progress', ['progress'], {})
@Entity('user_deleted')
export class UserDeleted extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('bigint', { width: 20 })
  user_id: number;

  @Column('varchar', { length: 255 })
  username: string;

  @Column('tinyint', { width: 1 })
  is_disabled: number;

  @Column('tinyint', { width: 1 })
  progress: number;

  @Column('double', { precision: 13, scale: 3 })
  cleaning_date: number;

  @Column('double', { precision: 13, scale: 3 })
  created_date: number;
}
