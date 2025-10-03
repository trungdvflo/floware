import { CALDAV_OBJ_TYPE, CARDAV_OBJ_TYPE } from "../constants/common.constant";
export interface IObjectMoveCalendar {
  userInfo: IUserCalDav;
  uid: string;
  compType: CALDAV_OBJ_TYPE | CARDAV_OBJ_TYPE;
  oldCalendarData: string;
  calendarid: number;
  oldCalUri: string;
  newCalUri: string;
  newCalId: number;
}

export interface IUserCalDav {
  userId: number;
  email: string;
  rsa: string;
}

export interface ICaldav {
  userInfo: IUserCalDav;
  collectionId: number;
  calendarUri: string;
}

export interface ISubCalendar {
  uid: string;
  calendarid: number;
  uri: string;
  linkedCount: number;
  oldCalendarData: string;
  objectType: string;
  linked: string;
}
export interface ICalendar extends ICaldav {
  calendarObjects: ISubCalendar [];
}

export interface ICalDavJob {
  VTODO?: ICalendar;
  VJOURNAL?: ICalendar;
  VEVENT?: ICalendar;
}

export interface ISabredav {
  uid: string;
  lastModifiedTime: number;
  comType: CALDAV_OBJ_TYPE;
  summary: string;
  description: string;
}