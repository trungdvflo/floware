import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'api_last_modified' })
export class ApiLastModified {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('int', { width: 20, unsigned: true, nullable: false })
  user_id: number;

  @Column('varchar', { length: 255, nullable: false })
  api_name;

  @Column('double', { precision: 13, scale: 3, nullable: false })
  api_modified_date;

  @Column('double', { precision: 13, scale: 3, nullable: false })
  created_date;

  @Column('double', { precision: 13, scale: 3 })
  updated_date;
}
