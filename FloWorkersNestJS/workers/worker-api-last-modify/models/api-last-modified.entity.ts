import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from '../../common/models/common.entity';

@Entity({ name: 'api_last_modified' })
export class LastModifyEntity extends CommonEntity {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('varchar', { length: 255, nullable: false })
  api_name: string;

  @Column('double', { precision: 13, scale: 3, nullable: false })
  api_modified_date: number;
}
