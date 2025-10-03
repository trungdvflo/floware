import {
  ArgumentMetadata,
  BadRequestException,
  Injectable, Optional, PipeTransform, Type, ValidationPipeOptions
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { ErrorCode } from '../constants/error-code';
import { BadRequestValidationException, filterMessages } from '../exceptions/validation.exception';

export interface BatchValidationOptions
  extends Omit<
    ValidationPipeOptions,
    'transform' | 'validateCustomDecorators' | 'exceptionFactory'
  > {
  items?: Type<unknown>;
  key?: string;
  typeObj?: number;
  allowEmptyArray?: boolean;
}

@Injectable()
export class SingleValidationPipe implements PipeTransform<any> {
  constructor(@Optional() readonly options: BatchValidationOptions = {}) {
    this.items = options.items;
    this.key = options.key;
  }

  private readonly items;
  private readonly key;

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    if (!this.key || !this.items) {
      return value;
    }

    if (!this.isObject(value[this.key])) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: (`${this.key} must be an object.`),
        attributes: value[this.key]
      });
    }

    if (this.isEmpty(value[this.key])) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_FAILED,
        message: (`${this.key} is invalid`),
        attributes: value[this.key]
      });
    }

    const object = plainToClass(this.items, value, {
      excludeExtraneousValues: true,
      exposeUnsetFields: false
    });
    const errors = await validate(object);

    if (errors.length > 0) {
      const { children } = errors[0];
      if (children.length > 0) {
        const item: ValidationError = children[0];
        const validationData = filterMessages(children);
        throw new BadRequestException({
          code: ErrorCode.VALIDATION_FAILED,
          message: validationData[0].message,
          attributes: { [item.property]: value[this.key][item.property] }
        });
      }
    }
    return object;
  }

  private isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  private isObject(o) {
    return o instanceof Object && o.constructor === Object;
  }

  private toValidate(metatype: Type<any>): boolean {
    const types: Type<any>[] = [Object];
    return !types.includes(metatype);
  }
}

@Injectable()
export class BatchValidationPipe implements PipeTransform<any> {
  private readonly items;
  private readonly key;
  private readonly isSingleObj;

  constructor(@Optional() readonly options: BatchValidationOptions = {}) {
    this.items = options.items;
    this.key = options.key;
    this.isSingleObj = options.typeObj;
  }

  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestValidationException(errors, metatype);
    }

    if (!this.key || !this.items) {
      return value;
    }

    // validation for single object
    if (this.isSingleObj === 0) {
      return object;
    }

    if (!this.options.allowEmptyArray && !Array.isArray(value[this.key])) {
      throw new BadRequestException(`${this.key} is not an array`);
    }

    let objErrors = [];
    const results = await Promise.all(object[this.key].map(async v => {
      const validationObject = plainToClass(this.items, v, {
        excludeExtraneousValues: true,
        exposeUnsetFields: false
      });
      const validationErrors = await validate(validationObject);

      if (validationErrors.length > 0) {
        objErrors = [...objErrors, validationErrors[0]];
        return null;
      }

      return validationObject;
    }));
    value = results.filter(Boolean);
    return {
      [this.key]: value,
      errors: filterMessages(objErrors)
    };
  }

  private toValidate(metatype: Type<any>): boolean {
    const types: Type<any>[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

export interface GetAllValidationOptions
  extends Omit<
    ValidationPipeOptions,
    'transform' | 'validateCustomDecorators' | 'exceptionFactory'
  > {
  entity: Type<unknown>;
  allowCustomFields?: string[];
}
