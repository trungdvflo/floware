import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import * as util from 'util';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_DATA_INVALID,
  SortObjectResponseMessage
} from '../../common/constants/message.constant';
import { buildFailItemResponse } from '../../common/utils/respond';
import { SORT_OBJECT_TYPE } from './sort-object.constant';

@Injectable()
export class SortObjectValidationPipe implements PipeTransform {
  private object_type: string;
  private key: string;
  private schema: any;

  constructor(options: { object_type: string; key: string; schema: any }) {
    this.object_type = options.object_type;
    this.key = options.key;
    this.schema = options.schema;
  }

  private transformMessage(error: ValidationError,
                           errorIndex: number[], errorList: any[], item: any) {
    // tslint:disable-next-line:radix
    const index = parseInt(error.property as any);
    if (index || index === 0) {
      // tslint:disable-next-line:radix
      errorIndex.push(parseInt(error.property as any));
    }
    const err = error.children[0];
    if (err && err.constraints) {
      const errorMsg = Object.values(err.constraints)[0];
      const code =
        err.property === 'order_number'
          ? ErrorCode.ORDER_NUMBER_INVALID
          : ErrorCode.VALIDATION_FAILED;
      errorList.push(buildFailItemResponse(code, errorMsg, err.target));
    } else {
      errorList.push(buildFailItemResponse(ErrorCode.VALIDATION_FAILED,
        Object.values(error.constraints)[0], item));
    }
  }

  private transformException(value: { data: any[] }, isVToDo: boolean) {
    const uniqueValues = new Set(
      value.data.map((v: any) => {
        return isVToDo ? v.uid : v.id;
      }),
    );

    if (uniqueValues.size < value.data.length) {
      throw new BadRequestException({
        code: ErrorCode.SORT_OBJECT_DUPLICATED,
        message: util.format(
          isVToDo
            ? SortObjectResponseMessage.SORT_OBJECT_UID_DUPLICATED
            : SortObjectResponseMessage.SORT_OBJECT_ID_DUPLICATED,
        ),
      });
    }

  }

  private tranformExceptionHandle(error: any) {
    return error instanceof BadRequestException
      ? error
      : new BadRequestException({
          code: ErrorCode.INVALID_DATA,
          message: MSG_DATA_INVALID,
        });
  }

  async transform(value: any, { metatype }: ArgumentMetadata) {
    try {
      if (!value) {
        return value;
      }
      if (!this.schema || !this.toValidate(this.schema)) {
        return value;
      }
      const errorList = [];
      const errorIndex: number[] = [];
      const object = plainToClass(this.schema, value);
      const isVToDo = this.object_type === SORT_OBJECT_TYPE.VTODO.toString();

      const results =  await Promise.all(object[this.key].map(async v => {
        const validationObject = plainToClass(this.schema, v, {
          excludeExtraneousValues: true
        });
        const validationErrors = await validate(validationObject);

        if (validationErrors.length > 0) {
          this.transformMessage(validationErrors[0], errorIndex, errorList, v);
          // objErrors = [...objErrors, validationErrors[0]];
          return null;
        }

        return validationObject;
      }));
      value.data = results.filter(Boolean);

      if (errorIndex.length > 0) {
        const successData = [];
        for (const [i, v] of value.data.entries()) {
          const isErr = errorIndex.includes(i);
          if (!isErr) {
            successData.push(v);
          }
        }
        value.data = successData;
      }
      if (value.data.length === 0) {
        return { data: value.data, errors: errorList };
      }

      this.transformException(value, isVToDo);

      return { data: value.data, errors: errorList };
    } catch (e) {
      throw this.tranformExceptionHandle(e);
    }
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

@Injectable()
export class SortObjectCheckStatusValidationPipe implements PipeTransform {
  private schema;
  constructor(schema) {
    this.schema = schema;
  }

  async transform(value: any, { metatype }: ArgumentMetadata) {
    try {
      if (!value) {
        return value;
      }
      const object = plainToClass(this.schema, value);
      const errors = await validate(object);
      if (errors.length > 0) {
        const message = Object.values(errors[0].constraints)[0];
        throw new BadRequestException({
          code: ErrorCode.VALIDATION_FAILED,
          message,
        });
      }
      return value;
    } catch (e) {
      if (e instanceof BadRequestException) {
        throw e;
      }
      throw new BadRequestException({
        code: ErrorCode.INVALID_DATA,
        message: MSG_DATA_INVALID,
      });
    }
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
