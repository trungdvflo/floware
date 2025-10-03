import { Column } from "typeorm";

export class ExportEntity {
  @Column('datetime', {
    name: 'export_date'
  })
  export_date: Date;
}
