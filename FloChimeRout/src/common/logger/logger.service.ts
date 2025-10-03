import { HttpStatus, Injectable } from '@nestjs/common';
import { GRAYLOG } from 'common/constants/environment.constant';
import { GraylogConfig, graylog } from "graylog2";
import cfGraylog from '../../configs/log';

@Injectable()
export class LoggerService {
  private readonly graylog2: graylog;
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

  public logInfo(shortMessage: string): void {
    try {
      this.graylog2.log(shortMessage);
    } catch (error) {
      return;
    }
  }

  public logError(shortMessage: string): void {
    try {
      this.graylog2.error(shortMessage);
    } catch (error) {
      return;
    }
  }

  public logInternalError(exception): void {
    try {
      if (exception.status < HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logError(exception.message);
        return;
      }
      this.graylog2.error({
        INTERNAL_SERVER_ERROR: exception
      });
    } catch (error) {
      return;
    }
  }
}