import {
  ArgumentsHost, BadRequestException, Catch, ExceptionFilter,
  HttpException,
  HttpStatus, InternalServerErrorException, NotFoundException, UnauthorizedException
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { ErrorCode } from '../constants/error-code';
import { MSG_ERR_BAD_REQUEST, MSG_ERR_SERVER_ERROR, MSG_TOKEN_INVALID } from '../constants/message.constant';
import { BadRequestValidationException, ValidationException } from '../exceptions/validation.exception';

@Catch(ValidationException)
export class ValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): any {
    const context = host.switchToHttp();
    const response = context.getResponse();
    return response.status(HttpStatus.BAD_REQUEST).json({
      code: HttpStatus.BAD_REQUEST,
      errors: exception.validationErrors
    });
  }
}

@Catch(BadRequestException)
export class BadRequestValidationFilter implements ExceptionFilter {
  catch(exception: ValidationException, host: ArgumentsHost): any {
    const context = host.switchToHttp();
    const response = context.getResponse();
    if (exception instanceof BadRequestValidationException) {
      return context.getResponse().status(HttpStatus.BAD_REQUEST).json(exception.getResponse());
    }
    return response.status(HttpStatus.BAD_REQUEST).json({
      code: HttpStatus.BAD_REQUEST,
      message: MSG_ERR_BAD_REQUEST,
      error: response
    });
  }
}

@Catch(InternalServerErrorException)
export class UnknownExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): any {
    const context = host.switchToHttp();
    const response = context.getResponse();
    // const logger = new LoggerService();
    // logger.error(exception.message, exception.stack, exception.name);
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      message: MSG_ERR_SERVER_ERROR
    });
  }
}

@Catch(NotFoundException)
export class BaseNotFoundValidationFilter implements ExceptionFilter<NotFoundException> {
  public catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    return response.status(HttpStatus.NOT_FOUND).json(exception.response);
  }
}

@Catch(BadRequestException)
export class BaseBadRequestValidationFilter implements ExceptionFilter<BadRequestException> {
  public catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    let errorResponse = exception.response;
    if (exception.response && !exception.response.error) {
      errorResponse = {
        error: exception.response
      };
    }
    delete errorResponse.data;
    return response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    if (!(exception instanceof HttpException)) {
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: MSG_ERR_SERVER_ERROR,
        sentry: response.sentry
      });
    }
    if (exception instanceof BadRequestValidationException) {
      return response.status(HttpStatus.BAD_REQUEST)
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
          message: exception.message
        }
      });
    }
    if (exception instanceof UnauthorizedException) {
      const message = response.mesage || MSG_TOKEN_INVALID;
      return response.status(HttpStatus.UNAUTHORIZED).json({
        error: {
          code: ErrorCode.UNAUTHORIZED_REQUEST,
          message
        }
      });
    }
    return response.status(exception.getStatus()).json({
      message: exception.message,
      sentry: response.sentry
    });
  }
}
