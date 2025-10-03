import { CallHandler, ExecutionContext, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface Response<T> {
    data: T;
}

@Injectable()
export class ResponseMappingInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const method = context.getArgByIndex(0).method;
    if(method === 'GET') {
      return next.handle().pipe(map(res => {
        if(!res) return;
        return res;
      }));
    } else if (['POST', 'PUT', 'DELETE'].includes(method)) {
      return next.handle().pipe(map(res => {
        let statusCode = HttpStatus.OK;
        if(!res) {
          context.switchToHttp()
          .getResponse()
          .status(HttpStatus.NO_CONTENT);
          return;
        }
        const data = res.data;
        if(data && Array.isArray(data)) {
          const errors = res.error?.errors;
          if(!errors || errors.length === 0) {
            const isNotBatchDelete = context.switchToHttp()
              .getRequest().url.indexOf('/delete') === -1;
            statusCode = (method === 'POST' && isNotBatchDelete)
              ? HttpStatus.CREATED : HttpStatus.OK;
          } else if(errors?.length && data.length) {
            statusCode = 207;
          } else if(data.length === 0) {
            statusCode = HttpStatus.BAD_REQUEST;
          }
        }
        context.switchToHttp()
                   .getResponse()
                   .status(statusCode);
        return res;
      }));
    }
    return next.handle().pipe(map(res => res));
  }
}