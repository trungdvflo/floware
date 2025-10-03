import { Injectable } from '@nestjs/common';
import { graylog, GraylogConfig } from "graylog2";
import cfGraylog from '../../configs/log';
import { GRAYLOG } from '../constants/env';
@Injectable()
export class LoggerService  {
  private readonly graylog2:graylog;
  private static instance: LoggerService;
  constructor() {
    const graylogConfig: GraylogConfig = {
      hostname: GRAYLOG.HOSTNAME,
      servers: [{
        host: cfGraylog().dsn,
        port: cfGraylog().port
      }],
      facility: cfGraylog().facility,
      bufferSize: cfGraylog().bufferSize,
    };
    this.graylog2 = new graylog(graylogConfig);
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }

    return LoggerService.instance;
  }

  public logInfo(shortMessage: string, fullMessage?: any, dataLog?: any): void {
    try {
      this.graylog2.log(shortMessage, fullMessage, dataLog);
    } catch (error) {
      // tslint:disable-next-line: no-console
      console.log(error); // show log on server to check bug
      return;
    }
  }

  public logError(shortMessage: string, fullMessage?: any, dataLog?: any): void {
    try {
      this.graylog2.error(shortMessage, fullMessage, dataLog);
    } catch (error) {
      // tslint:disable-next-line: no-console
      console.log(error); // show log on server to check bug
      return;
    }
  }

  /*
  TODO: handle error
  */
  // tslint:disable-next-line: no-empty
  public error(shortMessage: any, longMessage?: string, dataLog?: JSON): void {}
}