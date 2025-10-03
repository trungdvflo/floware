import {
  ArgumentMetadata, BadRequestException,
  Injectable, PipeTransform,
  UseFilters, ValidationError
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ErrorCode } from "../../common/constants/error-code";
import { MSG_DATA_INVALID } from "../../common/constants/message.constant";
import { BadRequestValidationFilter } from "../../common/filters/validation-exception.filters";
import { buildSingleResponseErr } from "../../common/utils/respond";
import { ReqUserProfileDto } from '../../modules/users/dtos/users-profile.dto';

@UseFilters(BadRequestValidationFilter)
@Injectable()
export class UserValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    try {
      if (!metatype || !this.toValidate(metatype)) {
        return value;
      }
      const object = plainToClass(metatype, value);
      object.data = plainToClass(ReqUserProfileDto, value.data,
        { excludeExtraneousValues: true });
      if (!this.isObject(value.data)) {
        throw new BadRequestException(buildSingleResponseErr(
          ErrorCode.INVALID_DATA, MSG_DATA_INVALID, value));
      }
      if (Object.keys(object.data).length === 0) {
        throw new BadRequestException(buildSingleResponseErr(
          ErrorCode.INVALID_DATA, MSG_DATA_INVALID, value));
      }
      const errors: ValidationError[] = await validate(object);
      if (errors.length > 0) {
        const { children } = errors[0];
        if (children.length > 0) {
          const item: ValidationError = children[0];
          const message = this.filterMessage(item);
          throw new BadRequestException(
            buildSingleResponseErr(ErrorCode.VALIDATION_FAILED, message, item.target));
        }
      }
      return object;
    } catch (e) {
      throw e instanceof BadRequestException ? e : new BadRequestException(buildSingleResponseErr(
        ErrorCode.INVALID_DATA, MSG_DATA_INVALID, value));
    }
  }

  private isObject(o) {
    return o instanceof Object && o.constructor === Object;
  }

  private filterMessage(error: ValidationError): string {
    return Object.values(error.constraints).join(', ');
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
