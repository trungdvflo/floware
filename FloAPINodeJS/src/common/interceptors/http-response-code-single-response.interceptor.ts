import {
  CallHandler, ExecutionContext, HttpStatus,
  Injectable, NestInterceptor
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
export interface Response<T> {
  data: T;
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
        if (url.includes('/delete') || method === 'PUT' || url.includes('/recover')) {
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