import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from './common.entity';

@Index('idx_user_id', ['user_id'], {})
@Index('idx_source_id', ['source_id'], {})
@Index('idx_source_type', ['source_type'], {})
@Entity({ name: 'linked_file_common' })
export class LinkedFileCommonEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id" })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  uid: string;

  @Column("bigint", { width: 20 })
  source_id: number;

  @Column("varchar",{ length: 20, nullable: false})
  source_type: string;

  @Column("bigint", { width: 20 })
  file_common_id: number;
}