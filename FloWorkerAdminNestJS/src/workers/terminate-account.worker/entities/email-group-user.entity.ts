import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('contact_avatar')
export class EmailGroupUser {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column('bigint', { width: 20 })
  user_id: number;
}
