import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { Meeting } from 'aws-sdk/clients/chimesdkmeetings';
import { CONFERENCE_NON_USER_TABLE_NAME } from 'configs/typeorm.util';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { DateCommon } from './date-common.entity';

@Entity({ name: CONFERENCE_NON_USER_TABLE_NAME })
export class ConferenceNonUserEntity extends DateCommon {
  @PrimaryGeneratedColumn('increment', { type: 'bigint', name: 'id' })
  id: number;

  @Column('json', {
    name: 'meeting_config',
    nullable: true,
    transformer: new JsonTransformer<Meeting>(),
  })
  meeting_config: Meeting;

  @Column('text', {
    name: 'external_attendee',
  })
  external_attendee: string;

  @Column('text', {
    name: 'join_token',
  })
  join_token: string;

  @Column('varchar', { name: 'meeting_id', length: 500 })
  meeting_id: string;

  @Column('varchar', { name: 'attendee_id', length: 300 })
  attendee_id: string;
}
