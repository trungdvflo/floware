import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  Optional,
  PipeTransform,
  UseFilters
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { ACTION } from '../../common/constants';
import { BadRequestValidationException, filterMessages } from '../../common/exceptions/validation.exception';
import { BadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { BatchValidationOptions } from '../../common/pipes/validation.pipe';
import {
  CreateHistoryActionDTO, CreateHistoryCaseFloContactDTO,
  CreateHistoryCasePhoneCallDTO,
  CreateHistoryCaseSkypeDTO,
  CreateHistoryCaseSRMailDTO,
  CreateHistoryDTO
} from './dtos/create-history.dto';

@UseFilters(BadRequestValidationFilter)
@Injectable()
export class HistoryValidationPipe implements PipeTransform<any> {
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

    const rs = await this.validateAction(value);
    value = rs.value;
    if (!value || value.length === 0) {
      return {
        [this.key]: value,
        errors: filterMessages(rs.objErrors),
      };
    }

    if (!this.key || !this.items) {
      return value;
    }

    const results = await Promise.all(value.map(async v => {
      const { schema } = this.getSchema(v);
      const validationObject: any = plainToClass(schema, v, {
        excludeExtraneousValues: true,
      });
      const validationErrors = await validate(validationObject);

      if (validationErrors.length > 0) {
        rs.objErrors.push(validationErrors[0]);
        return null;
      }
      return v;
    }));
    value = results.filter(Boolean);
    return {
      [this.key]: value,
      errors: filterMessages(rs.objErrors),
    };
  }

  private getSchema(item: any): {
    schema: any;
  } {
    const { action } = item;
    const rs = {
      schema: CreateHistoryDTO
    };
    switch (action) {
      case ACTION[0]:
        /*
        * action 4 - case skype chat
        * optional destination_object_type
        * allow empty destination_object_type
        * */
        if (item.destination_object_type?.length === 0) {
          rs.schema = CreateHistoryCaseSkypeDTO as any;
        }
        return rs;
      case ACTION[1]:
        /*
        * action 5 - case skype call
        * optional destination_object_type
        * allow empty destination_object_type
        * */
        if (item.destination_object_type?.length === 0) {
          rs.schema = CreateHistoryCaseSkypeDTO as any;
        }
        return rs;
      case ACTION[2]: // action 6
        /*
        * action 6 - case sent email and case 3rd party
        * optional destination_object_href, source_object_href
        * */
        rs.schema = CreateHistoryCaseSRMailDTO as any;
        return rs;
      case ACTION[3]:
        /*
        * action 7 - case received email
        * optional destination_object_href, source_object_href
        * */
        rs.schema = CreateHistoryCaseSRMailDTO as any;
        return rs;
      case ACTION[4]: // action 8
        /*
        * action 8 - case received email
        * optional source_object_href
        * */
        rs.schema = CreateHistoryCaseFloContactDTO as any;
        return rs;
      case ACTION[5]: // action 9
        /*
        * action 9 - case phone call
        * optional destination_object_href
        * allow empty destination_object_type
        * */
        if (item.destination_object_type?.length === 0) {
          rs.schema = CreateHistoryCasePhoneCallDTO as any;
        }
        return rs;
      case ACTION[6]: // action 10
        /*
        * action 10 - case sms
        * allow empty destination_object_type
        * */
        if (item.destination_object_type?.length === 0) {
          rs.schema = CreateHistoryCasePhoneCallDTO as any;
        }
        return rs;
      default:
        throw new Error(`Not support action ${action}`);
    }
  }

  private async validateAction(value) {
    const object = plainToClass(CreateHistoryActionDTO, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      throw new BadRequestValidationException(errors, CreateHistoryActionDTO);
    }

    if (!Array.isArray(value[this.key])) {
      throw new BadRequestException(`${this.key} is not an array`);
    }

    const results = await Promise.all(object[this.key].map(async v => {
      const validationObject = plainToClass(CreateHistoryDTO, v, {
        excludeExtraneousValues: true,
        exposeUnsetFields: false
      });
      const validationErrors = await validate(validationObject);

      if (validationErrors.length > 0) {
        errors.push(validationErrors[0]);
        return null;
      }

      return validationObject;
    }));
    value = results.filter(Boolean);
    return {
      value,
      objErrors: errors,
    };
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
