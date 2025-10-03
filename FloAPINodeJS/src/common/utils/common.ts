import { isEmpty, ValidationArguments } from 'class-validator';
import { createHash, randomBytes } from 'crypto';
import * as Re2 from "re2";
import { Readable } from 'stream';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import { LastModified, LastModifiedConference, LastModifiedMember } from '../../modules/bullmq-queue';
import { ChannelType, ChannelTypeNumber } from '../../modules/communication/interfaces';
import { KanbanCardErrorCode, KanbanCardResponseMessage } from '../../modules/kanban-card/kanban-card-response-message';
import { APP_IDS, SALT } from '../constants';
import { ErrorCode } from '../constants/error-code';
import { MSG_FIND_NOT_FOUND, MSG_ORDER_NUMBER_OUT_OF_RANGE } from '../constants/message.constant';
import { SaltEntity } from '../entities/salt.entity';
import { IParamError } from '../interfaces';
import { IDeleteDto, IDeleteFileMember } from '../interfaces/delete-item.interface';
import { ICloudObjectOrder, ITodoSort } from '../interfaces/object-order.interface';
import { LoggerService } from '../logger/logger.service';
import { getUtcMillisecond, getUtcSecond } from './date.util';
import { buildFailItemResponse } from './respond';
export const randomStringGenerator = () => uuid();
export const MAX_ORDER_INCREASE_NUM = 1;

export function generateSHAHash(data: string): string {
  const hash = createHash('sha256');
  hash.update(data);
  return hash.digest('hex');
}

export function decimalPlaces(decimal: string): number {
  const match = (`${decimal}`).match(new Re2(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/));
  if (!match) {
    return 0;
  }
  return Math.max(
    0,
    (match[1] ? match[1].length : 0) - (match[2] ? +match[2] : 0)
  );
}

export function generateDeletedDateByLength(length: number): number[] {
  const now = getUtcMillisecond();
  return Array.from(new Array(length), function mapFn(element, index) {
    return (now + index + 1) / 1000;
  });
}
export function validateEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export const formatMessageInvalid = (field: ValidationArguments) => {
  return `${field.property} payload invalid`;
};

export const transformName = ({ value }) => {
  return typeof value === 'string' ? value.trim() : (value !== null ? value : undefined);
};

export const transformColor = ({ value }) => {
  return typeof value === 'string' ?
    (value.trim().toLowerCase()) : (value !== null ? value : undefined);
};

export const TransformArchiveTime = ({ value, key, obj }) => {
  const archive_status: number = obj.archive_status;
  if (archive_status === undefined && value === undefined) {
    return;
  } else if (archive_status === 1) {
    return value ? value : getUtcSecond();
  } else {
    return value > 0 || !value ? 0 : value;
  }
};

export function generateIncOrderNumber(current_max: number, index: number): number {
  current_max = parseFloat(current_max.toString());
  const rs = current_max +
    this.MAX_ORDER_INCREASE_NUM + (index * this.MAX_ORDER_INCREASE_NUM);
  return parseFloat(rs.toFixed(1));
}

export function generateOutOfOrderRangeFailItem(item: any) {
  return buildFailItemResponse(ErrorCode.ORDER_NUMBER_OUT_OF_RANGE,
    MSG_ORDER_NUMBER_OUT_OF_RANGE, item);
}

export function sortByOrderNum(input_data: any[]) {
  return input_data.sort((a, b) => a.order_number > b.order_number ? 1 : -1);
}

export const AsyncForEach = async (collection, handle) => {
  return new Promise(async (resolve, reject) => {
    const task = [];

    Object.entries(collection).forEach(entry => {
      const [key, value] = entry;
      task.push(handle(value, key));
    });
    Promise.all(task).then((values) => {
      resolve(true);
    });
  });
};

export async function getMinTable(repo: Repository<any>, columnDb: string, user_id: number) {
  const aliasTable = repo.metadata.name || 'model';
  const query = await repo
    .createQueryBuilder(aliasTable)
    .select(`MIN(${aliasTable}.${columnDb})`, "minColumn")
    .where(`${aliasTable}.user_id = :user_id`, { user_id }).getRawOne();
  const num = query.minColumn;
  return num ? num : 0;
}

export async function getMaxTableKanban(repo: Repository<any>,
  columnDb: string, user_id: number, collection_id: number) {
  const aliasTable = repo.metadata.name || 'model';
  const query = await repo
    .createQueryBuilder(aliasTable)
    .select(`MAX(${aliasTable}.${columnDb})`, "maxColumn")
    .where(`${aliasTable}.user_id = :user_id`, { user_id })
    .andWhere(`${aliasTable}.collection_id = :collection_id`, { collection_id })
    .getRawOne();
  const num = query.maxColumn;
  return num ? num : 0;
}

export async function getMinTableKanbanCard(repo: Repository<any>,
  columnDb: string, user_id: number, kanban_id: number) {
  const aliasTable = repo.metadata.name || 'model';
  const query = await repo
    .createQueryBuilder(aliasTable)
    .select(`MIN(${aliasTable}.${columnDb})`, "minColumn")
    .where(`${aliasTable}.user_id = :user_id`, { user_id })
    .andWhere(`${aliasTable}.kanban_id = :kanban_id`, { kanban_id })
    .getRawOne();
  const num = query.minColumn;
  return num ? num : 0;
}

function generateRandomDecimal(): number {
  const maxInt = 4294967295;
  const randomInt = randomBytes(4).readUInt32LE(0);
  return randomInt / maxInt;
}

export function generateMinusOrderNum(currentNumber: number, pos: number) {
  const currentIndexByPos = MAX_ORDER_INCREASE_NUM * (pos + 1);
  // generate random last 4 numbers
  const random4Latest = Math.floor(generateRandomDecimal() * 1000) / 10000;
  return (currentNumber - currentIndexByPos - random4Latest).toFixed(4);
}

export function generatePlusOrderNum(currentNumber: number, pos: number) {
  const currentIndexByPos = MAX_ORDER_INCREASE_NUM * (pos + 1);
  // generate random last 4 numbers
  const random4Latest = Math.floor(generateRandomDecimal() * 1000) / 10000;
  return (currentNumber + currentIndexByPos + random4Latest).toFixed(4);
}
export class CResetOrderInput {
  public data: any[] = [];
  public errors: any[];
}

export function getMaxUpdatedDate(data: any[]) {
  try {
    if (isEmpty(data) === true) {
      return false;
    }
    const maxUpdatedDate = Math.max.apply(
      Math, data.map((item) => {
        return item.updated_date || false;
      })
    );
    return maxUpdatedDate;
  } catch (error) {
    return false;
  }
}
/**
 *
 * @param data
 * @returns
 */
export function IDWithoutDuplicates(data: IDeleteDto[]) {
  return data.filter((value, index, self) =>
    index === self.findIndex((t) => (t.id === value.id)));
}
/**
 *
 * @param data
 * @returns
 */
export function ItemWithoutDuplicates(data: IDeleteFileMember[]) {
  return data.filter((value, index, self) =>
    index === self.findIndex((t) => (t.uid === value.uid
      && t.collection_id === value.collection_id)));
}
/**
 *
 * @param memberUsers
 * @returns
 */
export function memberIDWithoutDuplicates(memberUsers: LastModifiedMember[]): LastModifiedMember[] {
  if (memberUsers.length < 2) return memberUsers;
  // remove duplicate user member
  return Array.from(
    memberUsers.reduce((m, { memberId, email, updatedDate }) =>
      m.set(memberId, {
        email,
        updatedDate: Math.max(m.get(memberId)?.updatedDate || 0, updatedDate)
      }), new Map()),
    ([memberId, { email, updatedDate }]) => ({ memberId, email, updatedDate }));
}
/**
 *
 * @param data
 * @returns
 */
export function userIDWithoutDuplicates(data: LastModified[]): LastModified[] {
  if (data.length < 2) return data;
  return Array.from(
    data.reduce((m, { userId, email, updatedDate }) => m.set(userId, {
      email,
      updatedDate: Math.max(m.get(userId)?.updatedDate || 0, updatedDate)
    }), new Map()),
    ([userId, { email, updatedDate }]) => ({ userId, email, updatedDate })) || [];
}
/**
 *
 * @param data
 * @returns
 */
export function channelIDWithoutDuplicates(data: LastModifiedConference[])
  : LastModifiedConference[] {
  if (data.length < 2) return data;
  return Array.from(
    data.reduce((m, { userId, channelId, updatedDate }) => m.set(userId, {
      channelId,
      updatedDate: Math.max(m.get(userId)?.updatedDate || 0, updatedDate)
    }), new Map()),
    ([userId, { channelId, updatedDate }]) => ({ userId, channelId, updatedDate })) || [];
}

export const Utils = {
  parseFolder: (uUid) => {
    const arrUid = uUid.split('-');
    const lastIndex = arrUid.length - 1;
    const _date = new Date(parseInt(arrUid[lastIndex], 10));
    // format 'Y/MM/DD'
    const formateFolder = _date.getFullYear()
      + '/' + ("0" + (_date.getMonth() + 1)).slice(-2)
      + '/' + ("0" + _date.getDate()).slice(-2);
    return formateFolder;
  },

  generateDownloadUrl: (uUid, appId, deviceUid?, token?) => {
    if (!uUid) return '';
    const params = {
      app_id: appId,
      type: 'auto_update',
      uuid: uUid,
      device_uid: deviceUid,
      token
    };

    const baseUrl = process.env.BASE_URL ? `${process.env.BASE_URL}/downloads`
      : `/downloads`;
    const stringQuery = Utils.serialize(params);
    const url = `${baseUrl}?${stringQuery}`;
    return url;
  },

  serialize: (obj) => {
    const str = [];
    for (const p in obj)
      if (obj.hasOwnProperty(p) && obj[p]) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }
};

export function getReadableStream(buffer: Buffer): Readable {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

export function getValueFromArrayObj(data: any[], keyRemove: string) {
  return data.map(item => {
    return item[keyRemove];
  });
}

export function filterKanbanIdExisted(dataRespond: any[], dataOrigin: any[]) {
  const itemNoExisted = [];
  const itemExisted = dataOrigin.filter(itemOrigin => {
    const dataCheck = dataRespond.some((itemRespond) => {
      if (itemRespond.id === itemOrigin.kanban_id) {
        itemOrigin.collection_id = itemRespond.collection_id;
        return itemRespond;
      }
    });
    if (!dataCheck) {
      const errItem = buildFailItemResponse(
        KanbanCardErrorCode.KANBAN_CARD_NOT_FOUND,
        KanbanCardResponseMessage.KANBAN_CARD_NOT_FOUND, itemOrigin);
      itemNoExisted.push(errItem);
    }
    return dataCheck;
  });

  return { itemExisted, itemNoExisted };
}
export function filterItemWithMessage(dataRespond: any[],
  dataOrigin: any[], errRespond: IParamError, keys: object) {
  const itemNoDuplicate = [];
  if (dataRespond.length === 0) {
    return { itemNoDuplicate, itemDubplicated: dataOrigin };
  }

  const itemDubplicated = dataOrigin.filter(item => {
    const dataCheck = dataRespond.some((itemRespond) => {
      if (itemRespond[keys['keyCompare']] === item[keys['keyData']]) {
        return itemRespond;
      }
    });
    if (!dataCheck) {
      const err = buildFailItemResponse(errRespond.code, errRespond.message, item);
      itemNoDuplicate.push(err);
    }
    return dataCheck;
  });
  return { itemNoDuplicate, itemDubplicated };
}

export function filterIdExistedWitMessage(dataRespond: any[],
  dataOrigin: any[], errRespond: IParamError) {
  const itemNoExisted = [];
  const itemExisted = dataOrigin.filter(itemOrigin => {
    const dataCheck = dataRespond.some((itemRespond) => {
      if (itemRespond.id === itemOrigin.id) {
        return itemRespond;
      }
    });
    if (!dataCheck) {
      const err = buildFailItemResponse(errRespond.code, errRespond.message, itemOrigin);
      itemNoExisted.push(err);
    }
    return dataCheck;
  });

  return { itemExisted, itemNoExisted };
}

export function filterIdExisted(dataRespond: any[], dataOrigin: any[], colName: string) {
  const itemNoExisted = [];
  const itemExisted = dataOrigin.filter(itemOrigin => {
    const dataCheck = dataRespond.some((itemRespond) => {
      if (itemRespond.id === itemOrigin.id) {
        if (colName === 'collection_id') {
          itemOrigin['collection_id'] = itemRespond.collection_id;
        }
        if (colName === 'kanban_id') {
          itemOrigin['kanban_id'] = itemRespond.kanban_id;
        }
        return itemRespond;
      }
    });
    if (!dataCheck) {
      const err = buildFailItemResponse(ErrorCode.SORT_OBJECT_NOT_FOUND,
        MSG_FIND_NOT_FOUND, itemOrigin);
      itemNoExisted.push(err);
    }
    return dataCheck;
  });

  return { itemExisted, itemNoExisted };
}

const duplicateItems = (data: ICloudObjectOrder[] | ITodoSort[], isId: boolean) => {
  const dupIds = data.map((v: ICloudObjectOrder | ITodoSort) => {
    return isId ? (v as ICloudObjectOrder).id : ((v as ITodoSort).uid);
  }).filter((v, i, self) => self.indexOf(v) !== i);
  const dupOrderNumbers = data.map(v => v.order_number)
    .filter((v, i, self) => self.indexOf(v) !== i);
  return { dupIds, dupOrderNumbers };
};

export function removeDuplicateItemsWithKanbanIds(data: any[]) {
  const othersKanbanCard = [];
  const dupIds = data.map(v => v.kanban_id).filter((v, i, self) => self.indexOf(v) !== i);
  const kanbanCards = data.filter(obj => {
    if (dupIds.includes(obj.kanban_id)) {
      return true;
    }
    othersKanbanCard.push(obj);
  });
  return { othersKanbanCard, kanbanCards };
}

export function removeDuplicateItems(data: any[], isId: boolean = true) {
  const dataPassed = [];
  const { dupIds, dupOrderNumbers } = duplicateItems(data, isId);
  const dataError = data.filter(obj => {
    if (isId) {
      if (dupIds.includes(obj.id) || (dupOrderNumbers.includes(obj.order_number))) {
        return true;
      }
    } else {
      if (dupIds.includes(obj.uid) || (dupOrderNumbers.includes(obj.order_number))) {
        return true;
      }
    }

    dataPassed.push(obj);
  });
  return { dataPassed, dataError };
}

export function filterDuplicateItemsWithKey(data: any[], keyFilter: string[]) {
  const dataError = [];
  const dataPassed = data.filter((value, index, self) => {
    if (index === self.findIndex((t) => {
      return keyFilter.reduce((resource, keyItem) => {
        return resource && t[keyItem] === value[keyItem];
      }, true);
    })) {
      return value;
    }
    dataError.push(value);
  });
  return { dataPassed, dataError };
}

export function filterDuplicateItem(data: any[]) {
  const dataError = [];
  const collectionIds = [];
  const dataPassed = data.filter((value, index, self) => {
    if (index === self.findIndex((t) => t.collection_id === value.collection_id)) {
      collectionIds.push(value.collection_id);
      return value;
    }
    dataError.push(value);
  });
  return { dataPassed, dataError, collectionIds };
}

export function getFailData(filterData: any[], keyFilter: number[]) {
  const data = keyFilter.filter(id => {
    const uniqueValues = new Set(filterData.map(v => v.collection_id !== id));
    if (uniqueValues.size < filterData.length) {
      return uniqueValues;
    }
  });
  return data;
}

export function mergeByOrderNumber(dataRespond: any[], dataOrigin: any[]) {
  return dataRespond.map(itemRespond => ({
    ...dataOrigin.find((itemOrigin) => {
      if (itemOrigin.order_number === itemRespond.order_number) {
        delete itemOrigin['user_id'];
        return itemOrigin;
      }
    }),
    ...itemRespond
  }));
}

export function separateItems(dataSeparate: any[]) {
  const flo3rd = [];
  const floItem = dataSeparate.filter(item => {
    if (item.account_id === 0) return item;
    flo3rd.push(item);
  });
  return { floItem, flo3rd };
}
export function pickObject(objects: any[], fields?: any[] | undefined) {
  if (fields === undefined || fields.length === 0) {
    return objects;
  }

  return objects.map((item) => {
    const result = {};
    fields.forEach(field => {
      result[field] = item[field];
    });
    return result;
  });
}

export const asyncFilter = async (arr, predicate) => {
  const results = await Promise.all(arr.map(predicate));
  return arr.filter((_v, index) => results[index]);
};

// example: n=3 => ?,?,?
export const getPlaceholderByN = (n: number) => '?,'.repeat(n).substring(0, n * 2 - 1);

export type LastModify = {
  collectionId?: number,
  channelId?: number,
  userId?: number,
  email?: string,
  timeLastModify: number[]
};

export function generateLastModifyItem(itemLastModify: LastModify[],
  collectionId: number, dateItem: number, userId: number = 0)
  : LastModify[] {
  const found: LastModify = itemLastModify.find(
    (item: LastModify) => item.collectionId === collectionId);
  if (found) {
    return itemLastModify.map((item: LastModify) => {
      if (item.collectionId === collectionId) {
        item.timeLastModify.push(dateItem);
      }
      return item;
    });
  }
  return [
    ...itemLastModify,
    {
      collectionId,
      userId,
      timeLastModify: [dateItem]
    }
  ];
}

export function replaceHref(object_href: string
  , searchCal: string, replaceCal: string
  , searchUsername: string, replaceUsername: string): string {
  if (!object_href) return undefined;
  return object_href.replace(searchCal, replaceCal)
    .replace(searchUsername, replaceUsername).replace(searchUsername, replaceUsername);
}

function getSalt2(userId: number): number {
  // Extract the last two digits
  let lastTwoDigits: number = userId % 100;
  if (lastTwoDigits === 0) {
    lastTwoDigits = 1;
  }
  const numberSalt2 = Math.abs(SALT.TOTAL_SALT - lastTwoDigits);
  return numberSalt2;
}

const generateSaltWith32Characters = async (): Promise<any> => {
  const key = randomBytes(32);
  const salt = generateSHAHash(key.toString());
  return salt.substring(0, SALT.MAX_LENGTH);
};

export async function generateSalt() {
  const saltItems = {};
  for (let i = 0; i < SALT.TOTAL_SALT; i++) {
    const salt = await generateSaltWith32Characters();
    saltItems[`salt${i}`] = salt;
  }
  return saltItems;
}
export function getSaltUser(saltData: SaltEntity, userId: number) {
  const saltKey1 = `salt${userId % 10}`;
  let saltKey2 = `salt${getSalt2(userId)}`;
  if (saltKey1 === saltKey2) {
    saltKey2 = `salt${saltKey1 + 10}`;
  }
  const salt1 = saltData[saltKey1];
  const salt2 = saltData[saltKey2];
  return { salt1, salt2 };
}

export const logRequest = (req) => {
  const app_id = req['header']?.appId || req['user']?.appId || '';
  const [appName] = Object.entries(APP_IDS).find(([, v]) => v === app_id);
  const info = {
    request_time: new Date(),
    method: req.method,
    app_name: `FLO${appName.toLocaleUpperCase()}`,
    path: req.url || '',
    app_id,
    device_uid: req['header']?.deviceUid || req['user']?.deviceUid || '',
  };
  LoggerService.getInstance().logInfo(`${JSON.stringify(info)}`);
};

export const getPlatformByAppId = (appId: string) => {
  switch (appId) {
    case APP_IDS.ipad:
      return 'IPAD';
    case APP_IDS.iphone:
      return 'IPHONE';
    case APP_IDS.web:
      return 'WEB';
    case APP_IDS.macInternal:
      return 'mac internal';
    case APP_IDS.mac:
      return 'MAC';
    default:
      return 'UNKNOWN';
  }
};

export const getChannelTypeNumber = (channelType: ChannelType): ChannelTypeNumber | null => {
  switch (channelType) {
    case ChannelType.SHARED_COLLECTION:
      return ChannelTypeNumber.SHARED_COLLECTION;
    case ChannelType.CONFERENCE:
      return ChannelTypeNumber.CONFERENCE;
  }
};