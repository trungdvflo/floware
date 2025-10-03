import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { NAME_ENTITY } from "../constants/typeorm.constant";
import { VARBINARY_STRING_TRANSFORMER } from "../utils/varbinary-string.transformer";
import { CalendarInstanceEntity } from "./calendar-instance.entity";
import { CalendarObjectEntity } from "./calendar-object.entity";

@Entity({ name: NAME_ENTITY.CALENDAR })
export class CalendarEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "synctoken", unsigned: true, default: () => "'1'" })
  synctoken: number;

  @Column("varbinary", {
    name: "components"
    , nullable: true
    , length: 255
    , transformer: VARBINARY_STRING_TRANSFORMER
  })
  components: string | null;

  @OneToMany(() => CalendarInstanceEntity, (ci) => ci.calendar)
  calendarInstances: CalendarInstanceEntity[];

  @OneToMany(() => CalendarObjectEntity, (ins) => ins.calendar)
  calendarObjects: CalendarObjectEntity[];
}
