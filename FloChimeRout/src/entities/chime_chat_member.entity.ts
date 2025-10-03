import { CHIME_CHAT_MEMBER_TABLE_NAME } from 'configs/typeorm.util';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: CHIME_CHAT_MEMBER_TABLE_NAME })
export class ChimeChatMemberEntity {
  @PrimaryGeneratedColumn('increment', { name: 'id' })
  id: number;

  @Column('text', { name: 'app_instance_user_arn', nullable: false })
  app_instance_user_arn: string;

  @Column("bigint", { name: 'internal_user_id', width: 20, nullable: false })
  internal_user_id: number;

  @Column('varchar', { name: 'internal_user_email', length: 255 })
  internal_user_email: string;

  @Column('double', {
    name: 'created_date',
    precision: 13,
    scale: 3,
    nullable: false,
  })
  created_date: number;

  @Column('double', {
    name: 'updated_date',
    precision: 13,
    scale: 3,
    nullable: false,
  })
  updated_date: number;
}
