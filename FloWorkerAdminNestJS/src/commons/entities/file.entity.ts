import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'file', synchronize: true })
export class File {
  @PrimaryGeneratedColumn('increment', { type: 'int', name: 'id' })
  id: number;

  @Column('bigint', { width: 255, name: 'user_id' })
  user_id: number;
}
