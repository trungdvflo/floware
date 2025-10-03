import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export enum GroupType {
  USER = '0',
  ADMIN = '1'
}
@Index('idx_name', ['name'], { unique: true })
@Entity('group')
export class Group {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id' })
  id: number;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text')
  description: string;

  @Column('enum', {
    enum: GroupType,
    default: GroupType.USER
  })
  group_type: string;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: true
  })
  updated_date: number | null;
}
