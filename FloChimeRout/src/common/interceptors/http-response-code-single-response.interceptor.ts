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
  if (res.Errors && Array.isArray(res.Errors) && res.Errors.length) {
    return ResponseCode.MULTI_STATUS;
  } else {
    return method === 'PUT' ? HttpStatus.OK : HttpStatus.CREATED;
  }
};
@Injectable()
export class HttpSingleResponseCodeInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.getArgByIndex(0);
    const method = request.method;
    const url = request.url;
    if (['POST', 'PUT'].includes(method) && url) {
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
