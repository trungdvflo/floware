import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { CALENDAR_INSTANCE_ACCESS, CALENDAR_INSTANCE_SHARE_INVITE_STATUS } from '../constants/common';
import { VARBINARY_STRING_TRANSFORMER } from '../transformers/varbinary-string.transformer';

@Entity({ name: 'calendarinstances' })
export class CalendarInstance {
  @PrimaryGeneratedColumn('increment', {
    name: 'id',
    type: 'int',
  })
  @ApiProperty({ example: 1 })
  id: number;

  @Column('int', {
    name: 'calendarid',
    width: 20,
  })
  @ApiProperty({ example: 1 })
  calendarid: number;

  @Column("varbinary", {
    name: "principaluri",
    length: 100,
    transformer: VARBINARY_STRING_TRANSFORMER,
    nullable: true,
  })
  @ApiProperty({ required: false, example: 'principals/tester_1619165717724@flouat.net' })
  principaluri: string;

  @Column("tinyint", {
    name: "access",
    unsigned: true,
    default: () => "'1'",
  })
  @IsIn([
    CALENDAR_INSTANCE_ACCESS.OWNER,
    CALENDAR_INSTANCE_ACCESS.READ,
    CALENDAR_INSTANCE_ACCESS.READ_WRITE
  ])
  @ApiProperty({ example: 1 })
  access: number;

  @Column("varchar", {
    name: "displayname",
    length: 100,
    nullable: true,
  })
  @ApiProperty({ required: false, example: 'General' })
  displayname: string;

  @Column("varbinary", {
    name: "uri",
    length: 200,
    transformer: VARBINARY_STRING_TRANSFORMER,
    nullable: true,
  })
  @ApiProperty({ required: false, example: '0a54bb20-a40c-11eb-bc69-bb27e9fcb7a3' })
  uri: string;

  @Column("text", {
    name: "description",
    nullable: true,
  })
  @ApiProperty({ required: false, example: 'General' })
  description: string;

  @Column('int', {
    name: 'calendarorder',
    width: 11,
  })
  @ApiProperty({ example: 0 })
  calendarorder: number;

  @Column("varbinary", {
    name: "calendarcolor",
    length: 200,
    transformer: VARBINARY_STRING_TRANSFORMER,
    nullable: true,
  })
  @ApiProperty({ required: false, example: '#4986e7' })
  calendarcolor: string;

  @Column("text", {
    name: "timezone",
    nullable: true,
  })
  @ApiProperty({
    required: false, example: `BEGIN:VCALENDAR
                                PRODID:icalendar-nodejs
                                VERSION:2.0
                                BEGIN:VTIMEZONE
                                TZID:America/Chicago
                                TZURL:http://tzurl.org/zoneinfo-outlook/America/Chicago
                                X-LIC-LOCATION:America/Chicago
                                BEGIN:DAYLIGHT
                                TZOFFSETFROM:-0600
                                TZOFFSETTO:-0500
                                TZNAME:CDT
                                DTSTART:19700308T020000
                                RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
                                END:DAYLIGHT
                                BEGIN:STANDARD
                                TZOFFSETFROM:-0500
                                TZOFFSETTO:-0600
                                TZNAME:CST
                                DTSTART:19701101T020000
                                RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
                                END:STANDARD
                                END:VTIMEZONE
                                END:VCALENDAR
  ` })
  timezone: string;

  @Column("tinyint", {
    name: "transparent",
    unsigned: true,
    default: () => "'0'",
  })
  @ApiProperty({ example: 0 })
  transparent: number;

  @Column("varbinary", {
    name: "share_href",
    length: 100,
    transformer: VARBINARY_STRING_TRANSFORMER,
    nullable: true,
  })
  @ApiProperty({ required: false, example: 'Share href' })
  share_href: string;

  @Column("varchar", {
    name: "share_displayname",
    length: 100,
    nullable: true,
  })
  @ApiProperty({ required: false, example: 'Share display name' })
  share_displayname: string;

  @Column("tinyint", {
    name: "share_invitestatus",
    unsigned: true,
    default: () => "'2'",
  })
  @IsIn([
    CALENDAR_INSTANCE_SHARE_INVITE_STATUS.NO_RESPONSE,
    CALENDAR_INSTANCE_SHARE_INVITE_STATUS.ACCEPTED,
    CALENDAR_INSTANCE_SHARE_INVITE_STATUS.DECLINED,
    CALENDAR_INSTANCE_SHARE_INVITE_STATUS.INVALID
  ])
  @ApiProperty({ example: 2 })
  share_invitestatus: number;
}