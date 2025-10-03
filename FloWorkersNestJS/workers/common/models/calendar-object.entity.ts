import {
  Column,
  Entity, JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { CALDAV_OBJ_TYPE } from "../constants/common.constant";
import { NAME_ENTITY } from "../constants/typeorm.constant";
import { VARBINARY_STRING_TRANSFORMER } from "../utils/varbinary-string.transformer";
import { CalendarEntity } from "./calendar.entity";

@Entity({ name: NAME_ENTITY.CALENDAR_OBJECT })
export class CalendarObjectEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("longtext", { name: "calendardata", nullable: true })
  calendardata: string | null;

  @Column("varbinary", {
    name: "uri"
    , nullable: true
    , length: 200
    , transformer: VARBINARY_STRING_TRANSFORMER
  })
  uri: string | null;

  @Column("int", { name: "calendarid", unsigned: true })
  calendarid: number;

  @Column("int", { name: "lastmodified", nullable: true, unsigned: true })
  lastmodified: number | null;

  @Column("varbinary", {
    name: "etag"
    , nullable: true
    , length: 32
    , transformer: VARBINARY_STRING_TRANSFORMER
  })
  etag: string | null;

  @Column("int", { name: "size", unsigned: true })
  size: number;

  @Column("varbinary", {
    name: "componenttype"
    , length: 255
    , transformer: VARBINARY_STRING_TRANSFORMER
  })
  componenttype: CALDAV_OBJ_TYPE;

  @Column("int", { name: "firstoccurence", nullable: true, unsigned: true })
  firstoccurence: number | null;

  @Column("int", { name: "lastoccurence", nullable: true, unsigned: true })
  lastoccurence: number | null;

  @Column("varchar", { name: "uid", nullable: true, length: 200 })
  uid: string | null;

  @Column("int", { name: "invisible", default: () => "'0'" })
  invisible: number;

  @ManyToOne(type => CalendarEntity)
  @JoinColumn({ name: 'calendarid', referencedColumnName: 'id' })
  calendar: CalendarEntity;
}
