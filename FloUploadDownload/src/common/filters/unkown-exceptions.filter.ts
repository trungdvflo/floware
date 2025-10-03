import {
  ArgumentsHost, Catch, ExceptionFilter,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorCode } from '../constants/error-code';

@Catch(HttpException)
export class UnkownExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    delete (exception.getResponse())['statusCode'];

    const attributes = (exception.getResponse())['attributes']?
    (exception.getResponse())['attributes']: null;

    let respMgs = ((exception.getResponse())['message'])?
      (exception.getResponse())['message']: exception.getResponse();
    if(Array.isArray(respMgs)){
      respMgs = respMgs[0];
    }
    const message = Object.assign({ error: { code: ErrorCode.BAD_REQUEST, message: respMgs } });

    if(attributes!== null) {
      message.error['attributes'] = attributes;
    }

    res.status(status).json(message);
  }
}