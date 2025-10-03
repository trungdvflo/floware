import { JsonTransformer } from '@anchan828/typeorm-transformers';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { AlertParam } from '../dtos/alertParam';
import { DateCommon } from './date-common.entity';
import { SubTaksParam } from '../../modules/todo/dtos/subtask-todo.dto';

@Entity({ name: 'cal_todo' })
export class Todo extends DateCommon {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'bigint',
  })
  id: number;

  @Column('varchar', {
    name: 'uid',
    length: 255,
    // transformer: VARBINARY_STRING_TRANSFORMER
  })
  uid: string;

  @Column('int', {
    name: 'calendarid',
    width: 11
  })
  calendarid: number;

  @Column('int', {
    name: 'calendar_object_id',
    width: 11
  })
  calendar_object_id: number;

  @Column('varchar', {
    name: 'uri',
    length: 255
  })
  uri: string;

  @Column('tinyint', {
    name: 'star',
    width: 1
  })
  star: number;

  @Column('text', {
    name: 'description',
  })
  description: string;

  @Column('text', {
    name: 'summary',
  })
  summary: string;

  @Column('varchar', {
    name: 'location',
    length: 255
  })
  location: string;

  @Column('double', {
    name: 'completed_date',
    precision: 13,
    scale: 3,
  })
  completed_date: number;

  @Column('double', {
    name: 'due_date',
    precision: 13,
    scale: 3,
  })
  due_date: number;

  @Column('bigint', {
    name: 'duration',
    width: 20,
  })
  duration: number;

  @Column('json', {
    name: 'subtasks',
    transformer: new JsonTransformer<SubTaksParam[]>(),
  })
  subtasks: SubTaksParam[] | null;

  @Column('json', {
    name: 'alerts',
    transformer: new JsonTransformer<AlertParam[]>(),
  })
  alerts: AlertParam[] | null;

  @Column('tinyint', {
    name: 'stodo',
    width: 1
  })
  stodo: number;

  // @Column('varchar', {
  //   name: 'status',
  //   length: 255
  // })
  // status: string;

  // @Column('json', {
  //   name: 'organizer',
  //   transformer: new JsonTransformer<OrganizerParam>(),
  // })
  // organizer: OrganizerParam | null;

  // @Column('int', {
  //   name: 'sequence',
  //   width: 11,
  //   default: 0
  // })
  // sequence: number;

  // @Column('bigint', {
  //   name: 'start',
  //   width: 20
  // })
  // start: number;

  // @Column('varchar', {
  //   name: 'repeat_rule',
  //   length: 1000
  // })
  // repeat_rule: string;

  // @Column('varchar', {
  //   name: 'timezone',
  //   length: 100
  // })
  // timezone: string;

  // @Column('varchar', {
  //   name: 'tzcity',
  //   length: 100
  // })
  // tzcity: string;

  @Column('tinyint', {
    name: 'trashed',
    width: 1
  })
  is_trashed: number;

  @Column('bigint', {
    name: 'recurid',
    width: 20,
    default: null
  })
  recurid: number | null;

  // @Column('json', {
  //   name: 'exdates',
  //   nullable: true,
  //   transformer: new JsonTransformer<number[]>(),
  // })
  // exdates: number[] | null;
}