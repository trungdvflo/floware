import { BadRequestException, HttpStatus, Type, ValidationError } from '@nestjs/common';
import { ErrorCode } from '../constants/error-code';
import { ParamError } from '../interfaces';

export const getErrorMessage = (error: ValidationError): ValidationError => {
  if(!error.children || error.children.length === 0) return error;
  return getErrorMessage(error.children[0]);
};

export const filterMessages = (validationErr: ValidationError[]) => {
  return validationErr.map((error) => {
    let message = '';
    error = getErrorMessage(error);
    message = error.constraints && Object.values(error.constraints).join(', ');
    if(!message) message = `${error.property} is invalid`;
    return {
      code: ErrorCode.VALIDATION_FAILED,
      message,
      attributes: {
        [error.property]: error.target[error.property],
        ref: error.target['ref']
      },
    };
  });
};

const filterMessage =
  (validationErr: ValidationError, meta: Type<unknown>): BadRequestParamError<typeof meta> => {
  const error = filterMessages([validationErr])[0];
  return {
    code: ErrorCode.BAD_REQUEST,
    message: error.message
  } as BadRequestParamError<typeof meta>;
};

class BadRequestParamError<T> implements ParamError<T> {
  code: ErrorCode.BAD_REQUEST;
  message: 'Bad Request';
  attributes?: T;
}

class BadRequestValidationError<T> {
  code: HttpStatus.BAD_REQUEST;
  message: 'Bad Request';
  error: BadRequestParamError<T>;
}

export class BadRequestValidationException extends BadRequestException {
  constructor(public validationErrors: ValidationError[], meta: Type<unknown>) {
    super({
      error: filterMessage(validationErrors[0], meta)
    } as BadRequestValidationError<typeof meta>);
  }
}
export class ValidationException extends BadRequestException {
  constructor(public validationErrors: Error[]) {
    super(validationErrors);
  }
}