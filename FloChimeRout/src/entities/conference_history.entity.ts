import { CONFERENCE_HISTORY } from "configs/typeorm.util";
import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { DateCommon } from "./date-common.entity";

@Index('idx_user_id_and_member_id', ['user_id', 'member_id'], {})
@Entity({ name: CONFERENCE_HISTORY })
export class ConferenceHistory extends DateCommon {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column("varchar", { length: 255, nullable: false })
  uid: string;

  @Column("bigint", { name: 'user_id', width: 20, nullable: false })
  user_id: number;

  @Column("bigint", { name: 'member_id', width: 20, nullable: false })
  member_id: number;

  @Column('double', {
    name: 'end_time',
    precision: 13,
    scale: 3,
    nullable: false,
  })
  end_time: number;

  @Column("varchar", { length: 1000, nullable: false })
  meeting_id: string;

  @Column("varchar", { length: 1000, nullable: false })
  external_meeting_id: string;

  @Column('tinyint', {
    name: 'is_calling',
    width: 4,
    default: 1,
    nullable: false,
  })
  is_calling: number;
}