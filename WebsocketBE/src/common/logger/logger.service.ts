import { HttpStatus, Injectable } from '@nestjs/common';
import { GraylogConfig, graylog } from 'graylog2';
import cfGraylog from '../../configs/log';
import { GRAYLOG } from '../constants/env';
@Injectable()
export class LoggerService {
  private readonly graylog2: graylog;
  private static instance: LoggerService;
  constructor() {
    const graylogConfig: GraylogConfig = {
      hostname: GRAYLOG.HOSTNAME,
      servers: [
        {
          host: cfGraylog().dsn,
          port: cfGraylog().port,
        },
      ],
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

  /**
   * turn off log when NODE_ENV_FILTER_ENABLE = true
   * @param shortMessage
   * @returns
   */
  public logInfoFilter(shortMessage: string): void {
    try {
      if (!cfGraylog().filterEnable) {
        this.graylog2.log(shortMessage);
      }
    } catch (error) {
      return;
    }
  }

  public logInfo(shortMessage: string): void {
    try {
      if (process.env.NODE_ENV === 'development') {
        // tslint:disable-next-line: no-console
        console.log(`Real-time:: ${JSON.parse(shortMessage)}`);
      } else {
        this.graylog2.log(`Real-time:: ${shortMessage}`);
      }
    } catch (error) {
      return;
    }
  }

  public logError(shortMessage: string): void {
    try {
      if (process.env.NODE_ENV === 'development') {
        // tslint:disable-next-line: no-console
        console.log(`Real-time:: ERROR:: ${JSON.parse(shortMessage)}`);
      } else {
        this.graylog2.log(`Real-time:: ERROR:: ${shortMessage}`);
      }
    } catch (error) {
      return;
    }
  }

  public logInternalError(exception): void {
    throw exception;
    try {
      if (exception.status < HttpStatus.INTERNAL_SERVER_ERROR) {
        this.logError(exception.message);
        return;
      }
      this.graylog2.error({
        INTERNAL_SERVER_ERROR: exception,
      });
    } catch (error) {
      return;
    }
  }
}
