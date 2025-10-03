import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';

@Index('idx_user_id', ['user_id'], {})
@Index('idx_uid', ['uid'], {})
@Entity({ name: 'file_common' })
export class FileCommon extends DateCommon {
  @PrimaryGeneratedColumn('increment', { name: "id" })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  uid: string;

  @Column("text", { nullable: false })
  filename: string;

  @Column("text", { nullable: false })
  dir: string;

  @Column("varchar", { length: 255, nullable: false })
  ext: string;

  @Column("varchar", { length: 100, nullable: false })
  mime: string;

  @Column("int", { width: 11 })
  size: number | 0;
}