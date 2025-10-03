import { isEmpty, ValidationArguments } from 'class-validator';
import { Readable } from 'stream';
import { v4 as uuid } from 'uuid';
import { ErrorCode } from '../constants/error-code';
import { IParamError } from '../interfaces';
import { IDeleteDto, IDeleteFileMember } from '../interfaces/delete-item.interface';
import { ILasModifyDuplicate } from '../interfaces/file-share.interface';
import { getUtcMillisecond, getUtcSecond } from './date.util';
import { buildFailItemResponse } from './respond';

export const randomStringGenerator = () => uuid();
export const MAX_ORDER_INCREASE_NUM = 1;

export function decimalPlaces(decimal: string): number {
  const match = (`${decimal}`).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
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
  if (archive_status === 1) {
    if (!value) {
      return getUtcSecond();
    } else {
      return value;
    }
  } else {
    if (value > 0 || !value) {
      return 0;
    } else {
      return value;
    }
  }
};

export function generateIncOrderNumber(current_max: number, index: number): number {
  current_max = parseFloat(current_max.toString());
  const rs = current_max +
    this.MAX_ORDER_INCREASE_NUM + (index * this.MAX_ORDER_INCREASE_NUM);
  return parseFloat(rs.toFixed(1));
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

export function generateMinusOrderNum(currentNumber: number, pos: number) {
  const currentIndexByPos = MAX_ORDER_INCREASE_NUM * (pos + 1);
  // generate random last 4 numbers
  const random4Lastest = Math.floor(Math.random() * 1000) / 10000;
  return (currentNumber - currentIndexByPos - random4Lastest).toFixed(4);
}

export function generatePlusOrderNum(currentNumber: number, pos: number) {
  const currentIndexByPos = MAX_ORDER_INCREASE_NUM * (pos + 1);
  // generate random last 4 numbers
  const random4Lastest = Math.floor(Math.random() * 1000) / 10000;
  return (currentNumber + currentIndexByPos + random4Lastest).toFixed(4);
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

export function IDWithoutDuplicates(data: IDeleteDto[]) {
  return data.filter((value, index, self) =>
    index === self.findIndex((t) => (t.id === value.id)));
}

export function ItemWithoutDuplicates(data: IDeleteFileMember[]) {
  return data.filter((value, index, self) =>
    index === self.findIndex((t) => (t.uid === value.uid
      && t.collection_id === value.collection_id)));
}

export function removeWithoutDuplicates(data: ILasModifyDuplicate[]) {
  return Array.from(
    data.reduce((m, { userId, updateDate }) =>
      m.set(userId, Math.max(m.get(userId) || 0, updateDate)), new Map()),
    ([userId, updateDate]) => ({ userId, updateDate })) || [];
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

export type LastModify = { collectionId: number, timeLastModify: number[] };

export const generateLastModifyItem = (
  itemLastModify: LastModify[], collectionId: number, dateItem: number): LastModify[] => {
  const found: LastModify = itemLastModify.find((item: LastModify) =>
    item.collectionId === collectionId);
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
      timeLastModify: [dateItem]
    }
  ];
};