import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { VARBINARY_STRING_TRANSFORMER } from "../transformers/varbinary-string.transformer";
import { CalendarInstance } from "./calendar-instances.entity";

@Entity("calendars")
export class Calendar {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "synctoken", unsigned: true, default: () => "'1'" })
  synctoken: number;

  @Column("varbinary", {
    name: "components"
    , nullable: true
    , length: 255
    ,transformer: VARBINARY_STRING_TRANSFORMER
    , default: () => "VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM"
  })
  components: string | null;

  @OneToMany(() => CalendarInstance, (ins) => ins.calendar)
  calendarInstances: CalendarInstance[];
}
