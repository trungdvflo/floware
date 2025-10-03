
import { Injectable } from "@nestjs/common";
import { graylog, GraylogConfig } from "graylog2";
import graylogEnv from "../configs/graylog.config";
import { EMAIL_REGEX, FILTER_REGEX, FILTER_REGEX_VALUE } from "../constants/log.constant";
import { IGraylog } from "../interface/graylog.interface";

@Injectable()
export class Graylog {
  private readonly graylog2: graylog;
  private static instance: Graylog;
  constructor() {
    const graylogConfig: GraylogConfig = {
      hostname: graylogEnv().hostName,
      servers: [{
        host: graylogEnv().hostServer,
        port: graylogEnv().port,
      }],
      facility: graylogEnv().facility,
      bufferSize: graylogEnv().bufferSize,
    };
    this.graylog2 = new graylog(graylogConfig);
  }

  private deleteSensitiveData(obj) {
    Object.keys(obj).forEach((k) => {
      if (k.match(FILTER_REGEX)) {
        delete obj[k];
      } else if (typeof obj[k] === 'object' && obj[k] !== null) {
        obj[k] = this.deleteSensitiveData(obj[k]);
      } else if (FILTER_REGEX_VALUE.test(obj[k])) {
        obj[k] = obj[k].replace(FILTER_REGEX_VALUE, 'hidden');
      } else if (EMAIL_REGEX.test(obj[k])) {
        obj[k] = obj[k].replace(EMAIL_REGEX, 'hidden');
      }
    });
    return obj;
  }

  private filterBody(dataFilter) {
    if (!graylogEnv().filterEnable) {
      return dataFilter;
    }

    const dataLogs = dataFilter ? JSON.parse(JSON.stringify(dataFilter)) : {};
    this.deleteSensitiveData(dataLogs);
    return dataLogs;
  }

  public static getInstance(): Graylog {
    if (!Graylog.instance) {
      Graylog.instance = new Graylog();
    }

    return Graylog.instance;
  }

  public logInfo(logParam: IGraylog): void {
    try {
      const subMessage = logParam.jobName ? `with ${logParam.jobName} ` : '';
      const shortMessage = `Queue name: ${logParam.moduleName} ${subMessage} `;
      console.log(shortMessage, {
        message: logParam.message,
        respond: this.filterBody(logParam.fullMessage)
      });
    } catch (error) {
      console.error('graylog', error); // show log on server to check bug
      return;
    }
  }
}