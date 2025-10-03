import { Column, Entity, PrimaryColumn } from 'typeorm';
import { NAME_ENTITY } from '../constants/typeorm.constant';

@Entity({ name: NAME_ENTITY.QUOTA })
export class QuotaEntity {
  @PrimaryColumn("varchar", { length: 255, nullable: false })
  username: string;

  @Column('bigint', { width: 20, unsigned: true, nullable: false })
  bytes: number;

  @Column('int', { width: 11, unsigned: true, nullable: false })
  messages: number;

  @Column('bigint', { width: 20, unsigned: true, nullable: false })
  cal_bytes: number;

  @Column('bigint', { width: 20, unsigned: true, nullable: false })
  card_bytes: number;

  @Column('bigint', { width: 20, unsigned: true, nullable: false })
  file_bytes: number;

  @Column('bigint', { width: 20, unsigned: true, nullable: false })
  file_common_bytes: number;

  @Column('int', { width: 11, unsigned: true, nullable: false })
  num_sent: number;

  @Column('bigint', { width: 20, unsigned: true, nullable: false })
  qa_bytes: number;
}