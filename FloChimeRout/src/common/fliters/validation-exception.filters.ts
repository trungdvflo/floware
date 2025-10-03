import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  UnauthorizedException,
  ValidationError,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ErrorCode, ErrorMessage } from 'common/constants/erros-dict.constant';
import { BadRequestValidationException } from 'common/exceptions/validation.exception';

export const getErrorMessage = (error: ValidationError): ValidationError => {
  if (!error.children || error.children.length === 0) return error;
  return getErrorMessage(error.children[0]);
};

export const filterMessages = (validationErr: ValidationError[]) => {
  return validationErr.map((error) => {
    let message = '';
    error = getErrorMessage(error);
    message = error.constraints && Object.values(error.constraints).join(', ');
    if (!message) message = `${error.property} is invalid`;
    return {
      code: ErrorCode.VALIDATION_FAILED,
      message,
      attributes: {
        [error.property]: error.target[error.property],
        ref: error.target['ref'],
      },
    };
  });
};

export class ValidationException extends BadRequestException {
  constructor(public validationErrors: Error[]) {
    super(validationErrors);
  }
}

@Catch(BadRequestException)
export class BadRequestValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): any {
    const context = host.switchToHttp();
    const response = context.getResponse();
    if (exception instanceof BadRequestValidationException) {
      return context
        .getResponse()
        .status(HttpStatus.BAD_REQUEST)
        .json(exception.getResponse());
    }
    return response.status(HttpStatus.BAD_REQUEST).json({
      code: HttpStatus.BAD_REQUEST,
      message: ErrorMessage.MSG_ERR_BAD_REQUEST,
      error: response,
    });
  }
}

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    if (!(exception instanceof HttpException)) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: ErrorMessage.MSG_ERR_SERVER_ERROR,
        sentry: response.sentry,
      });
    }
    if (exception instanceof BadRequestValidationException) {
      return response
        .status(HttpStatus.BAD_REQUEST)
        .json(exception.getResponse());
    }
    if (exception instanceof BadRequestException) {
      const exceptionRes = exception.getResponse();
      if (exceptionRes && exceptionRes['statusCode']) {
        exceptionRes['code'] = exceptionRes['statusCode'];
        delete exceptionRes['statusCode'];
      }
      return response.status(HttpStatus.BAD_REQUEST).json({
        error: {
          code: ErrorCode.BAD_REQUEST,
          message: exception.message,
        },
      });
    }
    if (exception instanceof UnauthorizedException) {
      const message = response.mesage || ErrorMessage.MSG_TOKEN_INVALID;
      return response.status(HttpStatus.UNAUTHORIZED).json({
        error: {
          code: ErrorCode.UNAUTHORIZED_REQUEST,
          message,
        },
      });
    }
    const exResponse = exception.getResponse();
    if (
      !!exResponse['code'] &&
      exResponse['code'] === ErrorCode.INVALID_APP_UID
    ) {
      return response.status(HttpStatus.UNAUTHORIZED).json({
        error: exception.getResponse(),
      });
    }
    return response.status(exception.getStatus()).json({
      message: exception.message,
      sentry: response.sentry,
    });
  }
}
