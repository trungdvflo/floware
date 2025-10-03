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
import { GetPlatformReleaseDto } from './dto/get-platform-release.dto';

@UseFilters(BadRequestValidationFilter)
@Injectable()
export class PlatformReleaseValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    try {
      if (!metatype || !this.toValidate(metatype)) {
        return value;
      }
      const object = plainToClass(
        GetPlatformReleaseDto,
        value,
        { excludeExtraneousValues: true }
      );

      const errors: ValidationError[] = await validate(object);
      if (errors.length > 0) {
        const item: ValidationError = errors[0];
        const message = this.filterMessage(item);
        throw new BadRequestException({
          code: ErrorCode.VALIDATION_FAILED,
          message
        });

      }
      return object;
    } catch (e) {
      throw e instanceof BadRequestException ? e : new BadRequestException({
        code: ErrorCode.INVALID_DATA,
        message: MSG_DATA_INVALID
      });
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
