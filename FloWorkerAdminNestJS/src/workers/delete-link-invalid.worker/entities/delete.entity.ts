import { Column } from "typeorm";

export class DeleteEntity {
  @Column('datetime', {
    name: 'deleted_date'
  })
  deleted_date: Date;
}
