import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseCode } from '../../common/constants/response-code';

export interface Response<T> {
  data: T;
}

const getStatusCode = (req, res) => {
  const { method, url } = req;

  if (!res) return -1;

  if (!(Array.isArray(res.data) && res.data.length)) {
    return HttpStatus.BAD_REQUEST;
  }

  if (res.error && Array.isArray(res.error.errors) && res.error.errors.length) {
    return ResponseCode.MULTI_STATUS;
  } else {
    return method === 'PUT' || url.includes('/delete') || url.includes('/recover')
      ? HttpStatus.OK
      : HttpStatus.CREATED;
  }
};

@Injectable()
export class HttpResponseCodeInterceptor<T> implements NestInterceptor<T, Response<T>> {
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
