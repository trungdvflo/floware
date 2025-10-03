import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'push_change' })
export class PushChange {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('int', { width: 20, unsigned: true, nullable: false })
  user_id: number;

  @Column('double', { precision: 13, scale: 3, nullable: false })
  created_date;
}
