import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  ValidationPipeOptions,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { SingleError } from './respond';

@Injectable()
export class CommonValidationPipe implements PipeTransform {
  private options: ValidationPipeOptions;
  constructor(options?: ValidationPipeOptions) {
    this.options = options;
  }

  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      return value;
    }
    const object = plainToClass(metadata.metatype, value, {});
    const errors = await validate(object, this.options);
    if (errors.length > 0) {
      const error = errors[0];
      let message = '';
      for (const [key, v] of Object.entries(error.constraints)) {
        message += v + '; ';
      }
      const err = {
        message,
        attributes: error.property,
        code: 'BadRequest',
      };
      throw new BadRequestException(new SingleError(err));
    }

    return value;
  }
}
