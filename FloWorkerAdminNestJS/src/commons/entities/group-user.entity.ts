import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
@Index('user_group', ['user_id', 'group_id'], { unique: true })
@Entity('group_user')
export class GroupsUser {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id' })
  id: number;

  @Column('int', { name: 'user_id', unsigned: true })
  user_id: number;

  @Column('int', { name: 'group_id', nullable: true })
  group_id: number | null;
}
