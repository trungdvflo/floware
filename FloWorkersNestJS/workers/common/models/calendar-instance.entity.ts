import { BaseEntity, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { NAME_ENTITY } from "../constants/typeorm.constant";
import { VARBINARY_STRING_TRANSFORMER } from "../utils/varbinary-string.transformer";
import { CalendarEntity } from "./calendar.entity";

@Index("principaluri", ["principaluri", "uri"], { unique: true })
@Entity({ name: NAME_ENTITY.CALENDAR_INSTANCE })
export class CalendarInstanceEntity extends BaseEntity {
  @PrimaryGeneratedColumn({ type: "int", name: "id", unsigned: true })
  id: number;

  @Column("int", { name: "calendarid", unsigned: true })
  calendarid: number;

  @Column("varbinary", {
    name: "principaluri"
    , nullable: true
    , length: 100
    , transformer: VARBINARY_STRING_TRANSFORMER
  })
  principaluri: string | null;

  @Column("tinyint", {
    name: "access",
    comment: "1 = owner, 2 = read, 3 = readwrite",
    width: 1,
    default: () => "'1'",
  })
  access: number;

  @Column("varchar", { name: "displayname", nullable: true, length: 100 })
  displayname: string | null;

  @Column("varbinary", {
    name: "uri"
    , nullable: true
    , length: 200
    , transformer: VARBINARY_STRING_TRANSFORMER
  })
  uri: string | null;

  @Column("text", { name: "description", nullable: true })
  description: string | null;

  @Column("int", {
    name: "calendarorder",
    unsigned: true,
    default: () => "'0'",
  })
  calendarorder: number;

  @Column("varbinary", {
    name: "calendarcolor"
    , nullable: true
    , length: 10
    , transformer: VARBINARY_STRING_TRANSFORMER
  })
  calendarcolor: string | null;

  @Column("text", { name: "timezone", nullable: true })
  timezone: string | null;

  @Column("tinyint", { name: "transparent", width: 1, default: () => "'0'" })
  transparent: number;

  @Column("varbinary", {
    name: "share_href"
    , nullable: true
    , length: 100
    , transformer: VARBINARY_STRING_TRANSFORMER
  })
  share_href: string | null;

  @Column("varchar", { name: "share_displayname", nullable: true, length: 100 })
  share_displayname: string | null;

  @Column("tinyint", {
    name: "share_invitestatus",
    comment: "1 = noresponse, 2 = accepted, 3 = declined, 4 = invalid",
    width: 1,
    default: () => "'2'",
  })
  share_invitestatus: number;

  @ManyToOne(
    () => CalendarEntity
  )
  @JoinColumn([{ name: "calendarid", referencedColumnName: "id" }])
  calendar: CalendarEntity;
}
