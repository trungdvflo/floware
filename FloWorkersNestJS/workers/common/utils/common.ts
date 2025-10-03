import { randomBytes } from 'crypto';
import { MAIN_KEY_CACHE } from '../constants/sort-object.constant';
import { ShareMemberLastModify } from '../interface/api-last-modify.interface';
import { ISabredav } from '../interface/calendar.interface';
import { IResetObject, SortAbleObject } from '../interface/object.interface';

export const getUtcMillisecond = () => {
  return Date.now();
}

export const TimestampDouble = (millisecond: number = Date.now()): number => millisecond / 1000;

export const getTimestampDoubleByIndex = (currentTime: number, idx: number) => {
  const timeWithIndex = (currentTime + idx) / 1000;
  return timeWithIndex;
};

export const generateRandomDecimal = (): number => {
  const maxInt = 4294967295;
  const randomInt = randomBytes(4).readUInt32LE(0);
  return randomInt / maxInt;
}

export const memberIDWithoutDuplicates = (allTimes: ShareMemberLastModify[]) => {
  const setId = new Set(allTimes.map(usr => usr.memberId));
  const allId = Array.from(setId);
  return allId.map(id => {
    const allDate = allTimes
      .filter(({ memberId }) => id === memberId)
      .map(({ updatedDate }) => updatedDate);
    return {
      memberId: id,
      email: allTimes.find(({ memberId }) => id === memberId).email,
      updatedDate: Math.max(...allDate)
    };
  });
}

export const ResetOrderCacheKey = (data: IResetObject) => {
  return `${MAIN_KEY_CACHE}:order:${data.user_id}:${data.obj_type}:${data.request_uid}`;
}

export function groupArrayOfObjects(list: SortAbleObject[], key: string) {
  return list.reduce((rv, x) => {
    (rv[x[key].toString()] = rv[x[key].toString()] || []).push(x);
    return rv;
  }, {});
}

export const LAST_MODIFIED_REPORT_CACHE = ['third_party_account'];

export const PUSH_CHANGE_CONFIG = {
  INTERVAL_STOP_PUSH: 1000, // 1s
  SILENT_VALID: [0, 1],
  OFFSET: 0,
  LIMIT: 100,
};

export enum IS_TRASHED {
  NOT_TRASHED = 0,
  TRASHED = 1,
  DELETED = 2,
}

export const COLLECTION_TYPE = {
  SHARE_COLLECTION: 3,
};

export enum TRASH_TYPE {
  CANVAS = 'CANVAS'
  , EMAIL = 'EMAIL'
  , CSFILE = 'CSFILE'
  , FOLDER = 'FOLDER'
  , URL = 'URL'
  , VCARD = 'VCARD'
  , VEVENT = 'VEVENT'
  , VJOURNAL = 'VJOURNAL'
  , VTODO = 'VTODO'
}

export enum KANBAN_TYPE {
  NORMAL = 0,
  SYSTEM = 1,
}

export const RESET_ORDER_CONFIG = {
  MAX_ITEM_EACH_TIME_GET: 1000,
  DECREASE_ORDER_NUM: -1,
  INCREASE_ORDER_NUM: 1,
  REDIS_TTL: 3600, // 1 hours,
  REDIS_TTL_WHEN_DONE: 300 // 5m
};

export enum CALDAV_OBJ_TYPE {
  VJOURNAL = 'VJOURNAL',
  VTODO = 'VTODO',
  VEVENT = 'VEVENT',
}

export enum CARDAV_OBJ_TYPE {
  VCARD = 'VCARD',
}

export const SABREDAV_HEADER = {
  'Content-Type': 'text/calendar',
  'x-source': 'floworker'
};

export const SABREDAV_PAYLOAD = (data: ISabredav) => {
  const payloadSabredav =
    `BEGIN:VCALENDAR
  CALSCALE:GREGORIAN
  VERSION:2.0
  PRODID:-//BE Team/CalDAV V4.1.1//EN-US
  BEGIN:${data.comType}
  UID:${data.uid}
  DTSTAMP:20221025T045128Z
  LAST-MODIFIED:20221025T044933Z
  SUMMARY:${data.summary}
  DESCRIPTION:${data.description}
  END:${data.comType}
  END:VCALENDAR`
  return payloadSabredav;
};

// example: n=3 => ?,?,?
export const getPlaceholderByN = (n: number) => '?,'.repeat(n).substring(0, n * 2 - 1);


export const sleep = (time) =>
  new Promise(resolve => setTimeout(resolve, time));

export const isProduction = () => {
  return /flostage.com|floware.com/.test(process.env.FLO_DOMAIN_NAME);
}

export function memberWithoutDuplicates(memberUsers: any[]) {
  // remove duplicate user member
  return Array.from(
    memberUsers.reduce((m, { memberId, email, updateTime }: { memberId: string, email: string, updateTime: number }) =>
      m.set(memberId, {
        email,
        updateTime: Math.max(m.get(memberId) || 0, updateTime)
      }), new Map()),
    ([memberId, { email, updateTime }]: [number, { email: string, updateTime: number }]) => ({ memberId, email, updateTime }));
}