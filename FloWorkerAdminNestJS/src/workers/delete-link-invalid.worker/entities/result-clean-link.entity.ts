import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('result_clean_link')
export class ResultCleanLink {
  @PrimaryColumn('bigint', { type: 'int', name: 'id', unsigned: true })
  id: number;

  @Column('varchar', {
    length: 100,
  })
  name: string;

  @Column('int', {
    width: 11,
  })
  total_record_scaned: number;

  @Column('int', {
    width: 11,
  })
  total_record_invalided: number;

  @Column('int', {
    width: 11,
  })
  total_record_doubled: number;

  @Column('int', {
    width: 11,
  })
  total_record_notfound: number;

  @Column('datetime', {
    name: 'started_clean_time'
  })
  started_clean_time: Date;

  @Column('datetime', {
    name: 'finished_clean_time'
  })
  finished_clean_time: Date;
}
