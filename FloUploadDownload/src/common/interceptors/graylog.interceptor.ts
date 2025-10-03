import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import cfGraylog from '../../configs/log';
import { GRAYLOG } from '../constants/env';
import { FILTER_REGEX } from '../constants/log.constant';
import { LoggerService } from '../logger/logger.service';
import { filterBodyWithDict, FORMAT_API_INFO } from '../utils/graylog.util';

interface IHeaderLog {
  app_id: string;
  device_uid: string;
}
interface IFullMessage {
  path: string;
  fullUrl: string;
  method: string;
  headers: IHeaderLog;
  query?: any | {};
  params?: any | {};
  body?: any | {};
  sizeBody?: number;
}

@Injectable()
export class GraylogInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const { shortMessage, fullMessage } = this.handleHeaderProcess(context);
    return next.handle().pipe(
      map(items => {
        try {
          if (fullMessage.method === 'POST' || fullMessage.method === 'PUT') {
            if (fullMessage.sizeBody > GRAYLOG.BUFFERSIZE) {
              delete fullMessage['body'];
              LoggerService.getInstance().logInfo(shortMessage, fullMessage, items['error']);
              return items;
            }
            const { data } = fullMessage.body;
            // remove important field before logging data
            if (Array.isArray(data) && data.length > 0) {
              filterBodyWithDict(data);
            }

            // just log error
            LoggerService.getInstance().logInfo(shortMessage, fullMessage, items['error']);
            return items;
          }
          // no log data for method GET
          LoggerService.getInstance().logInfo(shortMessage, fullMessage);
          return items;
        } catch (err: unknown) {
          return items;
        }
      }),
    );
  }

  private deleteSensitiveData(obj) {
    Object.keys(obj).forEach((k) => {
      if (k.match(FILTER_REGEX)) {
        delete obj[k];
      } else if (typeof obj[k] === 'object' && obj[k] !== null) {
        obj[k] = this.deleteSensitiveData(obj[k]);
      }
    });
    return obj;
  }

  private filterBody(dataFilter) {
    if (!cfGraylog().filterEnable) {
      return dataFilter;
    }

    const dataLogs = dataFilter ? JSON.parse(JSON.stringify(dataFilter)) : {};
    this.deleteSensitiveData(dataLogs);
    return dataLogs;
  }

  private handleHeaderProcess(context: ExecutionContext) {
    const dataReq = context.switchToHttp().getRequest();
    const methodApi = dataReq.method;
    const pathApi = `${dataReq.headers.host}${dataReq.originalUrl}`;
    const statusCode = context.switchToHttp().getResponse().statusCode;
    const shortMessage = FORMAT_API_INFO(statusCode, methodApi, pathApi);

    const fullMessage: IFullMessage = {
      path: dataReq.path,
      fullUrl: dataReq.originalUrl,
      method: methodApi,
      headers: this.filterHeader(dataReq.headers),
    };

    if (methodApi === 'GET') {
      fullMessage.query = this.filterBody(dataReq.query);
      fullMessage.params = this.filterBody(dataReq.params);
    }
    if (methodApi === 'POST' || methodApi === 'PUT') {
      fullMessage.sizeBody = dataReq.socket.bytesRead;
      fullMessage.body = this.filterBody(dataReq.body);
    }
    return { shortMessage, fullMessage };
  }

  public filterHeader(headerData) {
    return {
      // Will not log app_id
      // app_id: headerData.app_id,
      device_uid: headerData.device_uid
    } as IHeaderLog;
  }
}
