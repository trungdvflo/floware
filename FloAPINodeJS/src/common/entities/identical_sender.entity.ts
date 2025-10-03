import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IDENTICAL_SENDER } from '../utils/typeorm.util';
import { DateCommon } from './date-common.entity';

@Entity({ name: IDENTICAL_SENDER })
export class IdenticalSender extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column('bigint', {
    name: 'filing_id',
    width: 20
  })
  filing_id: number;

  @Column('bigint', {
    name: 'suggested_collection_id',
    width: 20
  })
  suggested_collection_id: number;

  @Column("varchar", {
    name: "email_address",
    length: 255,
  })
  email_address: string;
}