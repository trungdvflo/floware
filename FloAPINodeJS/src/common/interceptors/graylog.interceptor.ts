import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import cfGraylog from '../../configs/log';
import { GRAYLOG } from '../constants/env';
import { LoggerService } from '../logger/logger.service';
import { FORMAT_API_INFO, deleteSensitiveData } from '../utils/graylog.util';

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
        // return items;
        try {
          if (fullMessage.method === 'POST' || fullMessage.method === 'PUT') {
            if (fullMessage.sizeBody > GRAYLOG.BUFFERSIZE) {
              delete fullMessage['body'];
              LoggerService.getInstance().logInfo(shortMessage);
              return items;
            }
            // const { data } = fullMessage.body;
            // // remove important field before logging data
            // if (Array.isArray(data) && data.length > 0) {
            //   filterBodyWithDict(data);
            // }
            // just log error
            LoggerService.getInstance().logInfo(shortMessage);
            return items;
          }
          // no log data for method GET
          LoggerService.getInstance().logInfo(shortMessage);
          return items;
        } catch (err: unknown) {
          return items;
        }
      }),
    );
  }

  private filterBody(dataFilter) {
    if (!cfGraylog().filterEnable) {
      return dataFilter;
    }
    // FB-2180: deep clone object required
    const dataLogs = dataFilter ? JSON.parse(JSON.stringify(dataFilter)) : {};
    return deleteSensitiveData(dataLogs);
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
      // fullMessage.body = this.filterBody(dataReq.body);
    }

    return { shortMessage, fullMessage };
  }

  public filterHeader(headerData) {
    return {
      // Will not log app_id
      // app_id: headerData.app_id,
      // device_uid: headerData.device_uid
    } as IHeaderLog;
  }
}
