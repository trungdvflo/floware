import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { API_LAST_MODIFIED_NAMES } from '../../../common/constants';
import { GetApiLastModifiedDto } from '../dto/get-api-last-modified.dto';

@Injectable()
export class ApiLastModifiedValidationPipe implements PipeTransform {
  async transform(value: GetApiLastModifiedDto, { metatype }: ArgumentMetadata) {
    if (!value) {
      return value;
    }
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const queryApiNames = value && value.api_name ? value.api_name.split(',') : [];
    const invalidQueryApiNames = queryApiNames
      .filter(queryApi => !API_LAST_MODIFIED_NAMES.includes(queryApi));
    if (invalidQueryApiNames.length) {
      throw new BadRequestException({
        message: `APIs [${invalidQueryApiNames.join('],[')}] are not supported`
      });
    }
    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}