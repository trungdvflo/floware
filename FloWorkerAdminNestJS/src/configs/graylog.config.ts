import { graylog, GraylogConfig } from 'graylog2';
import RE2 = require('re2');

import {
  GRAYLOG, FILTER_REGEX,
  FILTER_REGEX_VALUE, EMAIL_REGEX
} from '../commons/constants/graylog.constant';
import { IGraylog } from '../commons/interfaces/graylog.interface';

export class Graylog {
  private readonly graylog: graylog;
  private readonly filterEnable: boolean;
  private static instance: Graylog;

  constructor() {
    const graylogConfig: GraylogConfig = {
      hostname: GRAYLOG.HOSTNAME,
      servers: [
        {
          host: process.env.GRAYLOG_HOST,
          port: Number(process.env.GRAYLOG_PORT)
        }
      ],
      facility: GRAYLOG.FACILITY,
      bufferSize: GRAYLOG.BUFFERSIZE
    };
    this.filterEnable = process.env.NODE_ENV_FILTER_ENABLE
      ? process.env.NODE_ENV_FILTER_ENABLE.toLocaleLowerCase() === 'true'
      : false;
    this.graylog = new graylog(graylogConfig);
  }

  public static getInstance(): Graylog {
    if (!Graylog.instance) {
      Graylog.instance = new Graylog();
    }

    return Graylog.instance;
  }

  private isObj(v) {
    return typeof v === 'object' && v !== null;
  }

  private deleteSensitiveData(obj) {
    if (!obj) return obj;
    const emailRegex = new RE2(EMAIL_REGEX);
    Object.keys(obj).forEach((k) => {
      if (k.match(FILTER_REGEX)) {
        delete obj[k];
      } else if (typeof obj[k] === 'object' && obj[k] !== null) {
        obj[k] = this.deleteSensitiveData(obj[k]);
      } else if (FILTER_REGEX_VALUE.test(obj[k])) {
        obj[k] = obj[k].replace(FILTER_REGEX_VALUE, 'hidden');
      } else if (emailRegex.test(obj[k])) {
        obj[k] = obj[k].replace(EMAIL_REGEX, 'hidden');
      }
    });
    return obj;
  }

  private filterBody(dataFilter) {
    if (!this.filterEnable || Object.keys(dataFilter).length === 0) {
      return dataFilter;
    }

    const dataLogs = dataFilter ? JSON.parse(JSON.stringify(dataFilter)) : {};
    this.deleteSensitiveData(dataLogs);
    return dataLogs;
  }

  SendLog(logParam: IGraylog) {
    if (logParam.fullMessage && this.isObj(logParam.fullMessage)) {
      logParam.fullMessage = JSON.stringify(
        this.filterBody(logParam.fullMessage)
      );
    }
    this.graylog.log(logParam);
  }

  LogError(error) {
    try {
      this.graylog.error(error);
    } catch (e) {
      // tslint: disable
    }
  }
}
