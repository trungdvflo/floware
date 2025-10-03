import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';
import { CommonEntity } from './common.entity';

@Entity({ name: NAME_ENTITY.FILE_ATTACHMENT})
export class FileAttachmentEntity extends CommonEntity {
  @PrimaryGeneratedColumn('increment', { type: "int", name: "id" })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  uid: string;

  @Column('text', { nullable: true })
  local_path: string | null;

  @Column("text", { nullable: false })
  url: string;

  @Column('tinyint', { width: 1})
  source: number;

  @Column("text", { nullable: false })
  filename: string;

  @Column("varchar", { length: 255, nullable: false })
  ext: string;

  @Column("varbinary",{ length: 1000, nullable: false, transformer: {
    from(value) {
      return value.toString();
    },
    to(value) {
      return Buffer.from(value);
    }
  }})
  object_uid: string;

  @Column("varbinary",{ length: 1000, nullable: false, transformer: {
    from(value) {
      return value.toString();
    },
    to(value) {
      return Buffer.from(value);
    }
  }})
  object_type: string;

  @Column("varchar", { length: 255, nullable: false })
  client_id: string;

  @Column("int", { width: 11 })
  size: number | 0;
}