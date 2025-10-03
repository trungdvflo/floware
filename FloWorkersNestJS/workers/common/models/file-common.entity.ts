import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { CommonEntity } from './common.entity';

@Index('idx_user_id', ['user_id'], {})
@Index('idx_uid', ['uid'], {})
@Entity({ name: 'file_common' })
export class FileCommonEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id" })
  id: number;
  @Column("varchar", { length: 255, nullable: false })
  uid: string;
  @Column("text", { nullable: false })
  filename: string;
  @Column("text", { nullable: false })
  dir: string;
  @Column("varchar", { length: 255, nullable: false })
  ext: string;
  @Column("int", { width: 11 })
  size: number | 0;
  @Column("int", { width: 20 })
  user_id: number | 0;
}