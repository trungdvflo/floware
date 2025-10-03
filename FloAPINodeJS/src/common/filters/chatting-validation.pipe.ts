import {
  ArgumentMetadata, BadRequestException,
  Injectable, PipeTransform,
  UseFilters, ValidationError
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ErrorCode } from "../constants/error-code";
import { MSG_DATA_INVALID } from "../constants/message.constant";
import { buildSingleResponseErr } from "../utils/respond";
import { BadRequestValidationFilter } from "./validation-exception.filters";

@UseFilters(BadRequestValidationFilter)
@Injectable()
export class ChattingValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    try {
      if (!metatype || !this.toValidate(metatype)) {
        return value;
      }
      const object = plainToClass(metatype, value, { exposeUnsetFields: false });
      const errors: ValidationError[] = await validate(object);
      if (errors.length > 0) {
        const item: ValidationError = errors[0];
        const message = this.filterMessage(item);
        throw new BadRequestException(
          buildSingleResponseErr(ErrorCode.VALIDATION_FAILED, message, item.target));
      }
      return object;
    } catch (e) {
      throw e instanceof BadRequestException ? e : new BadRequestException(buildSingleResponseErr(
        ErrorCode.INVALID_DATA, MSG_DATA_INVALID, value));
    }
  }

  private filterMessage(error: ValidationError): string {
    return Object.values(error.constraints).join(', ');
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
