import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ResponseCode } from 'common/constants/response-code';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
export interface Response<T> {
  data: T;
}

const getStatusCode = (req, res) => {
  const { method, url } = req;
  if (!res) return -1;
  if (res.code) {
    const code = res.code;
    delete res.code;
    if (code > -1)
      return code;
  }
  if (!(Array.isArray(res.data) && res.data.length)) {
    return HttpStatus.BAD_REQUEST;
  }

  if (res.error && Array.isArray(res.error.errors) && res.error.errors.length) {
    return ResponseCode.MULTI_STATUS;
  } else {
    return method === 'PUT' || url.includes('/delete')
      ? HttpStatus.OK
      : HttpStatus.CREATED;
  }
};

const getStatusCodeGET = (req, res) => {
  const { method, url } = req;
  if (!res) return -1;
  if (res.code) {
    const code = res.code;
    delete res.code;
    if (code > -1)
      return code;
  }

  if (!res.data) {
    return HttpStatus.BAD_REQUEST;
  } else {
    return HttpStatus.OK;
  }
};

@Injectable()
export class HttpResponseCodeInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.getArgByIndex(0);
    const method = request.method;
    const url = request.url;
    if(method === 'GET') {
      return next.handle().pipe(map(res => {
        if(!res) return;
        const statusCode = getStatusCodeGET(request, res);
        context.switchToHttp().getResponse().status(statusCode);
        return res;
      }));
    } else if(['POST', 'PUT'].includes(method) && url) {
      return next.handle().pipe(
        map((res) => {
          if (!res) return;
          if (res.error) {
            delete res.data;
            context.switchToHttp().getResponse().status(HttpStatus.BAD_REQUEST);
            return res;
          }
          if (method === 'PUT') {
            context.switchToHttp().getResponse().status(HttpStatus.OK);
          } else {
            const statusCode = getStatusCode(request, res);
            context.switchToHttp().getResponse().status(statusCode);
          }
          delete res.error;
          return res;
        }),
      );
    }
    return next.handle().pipe(map((res) => res));
  }
}

@Injectable()
export class HttpSingleResponseCodeInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.getArgByIndex(0);
    const method = request.method;
    const url = request.url;
    if (['POST', 'PUT'].includes(method) && url) {
      return next.handle().pipe(map(res => {
        if (!res) return;
        if (res.error) {
          delete res.data;
          context.switchToHttp().getResponse().status(HttpStatus.BAD_REQUEST);
          return res;
        }
        if (url.includes('/delete') || method === 'PUT') {
          context.switchToHttp().getResponse().status(HttpStatus.OK);
        } else {
          context.switchToHttp().getResponse().status(HttpStatus.CREATED);
        }
        delete res.error;
        return res;
      }));
    }
    return next.handle().pipe(map(res => res));
  }
}
@Injectable()
export class HttpResponseArrayCodeInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const req = context.getArgByIndex(0);
    const { method, url } = req;

    if (['POST', 'PUT'].includes(method) && url) {
      return next.handle().pipe(
        map((res) => {
          const statusCode = getStatusCode(req, res);
          if (statusCode === -1) return;
          else context.switchToHttp().getResponse().status(statusCode);

          return res;
        }),
      );
    }
    return next.handle().pipe(map((res) => res));
  }
}