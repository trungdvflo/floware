import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  ValidationPipeOptions,
} from '@nestjs/common';
import { Attendee, AttendeeList } from 'aws-sdk/clients/chimesdkmeetings';
import { plainToClass } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';
import { APP_IDS } from 'common/constants/environment.constant';
import { ErrorMessage } from 'common/constants/erros-dict.constant';
import { LoggerService } from 'common/logger/logger.service';
import appConfig from 'configs/app.config';
import * as Re2 from 're2';
import { SingleError } from './respond';
export const MEETING_REGEX = new Re2(/[a-fA-F0-9]{8}(?:-[a-fA-F0-9]{4}){3}-[a-fA-F0-9]{12}/);
export const PHONE_REGEX = new Re2(/^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})\s*$/);


export const logRequest = (req) => {
  const app_id = req['header']?.appId || req['user']?.appId || '';
  const [appName] = Object.entries(APP_IDS).find(([, v]) => v === app_id);
  const info = {
    request_time: new Date(),
    method: req.method,
    app_name: `FLO${appName.toLocaleUpperCase()}`,
    path: req.url || '',
    app_id,
    device_uid: req['header']?.deviceUid || req['user']?.deviceUid || '',
  };
  LoggerService.getInstance().logInfo(`${JSON.stringify(info)}`);
};

export const getErrorMessage = (error: ValidationError): ValidationError => {
  if (!error.children || error.children.length === 0) return error;
  return getErrorMessage(error.children[0]);
};

export const filterMessage = (validationErr: ValidationError[]) => {
  return validationErr.map((error) => {
    let message = '';
    error = getErrorMessage(error);
    message = error.constraints && Object.values(error.constraints).join(', ');
    if (!message) message = `${error.property} is invalid`;
    return {
      code: ErrorMessage.VALIDATION_FAILED,
      message,
    };
  });
};

export function filterItems(data: any[], itemDb: any[]) {
  const filteredItems: any[] = [];
  const nonMatchingItems: any[] = [];

  data.forEach((item) => {
    const matchingItem = itemDb.find((validItem) => validItem.internal_message_uid === item.internal_message_uid);
    if (matchingItem) {
      item['id'] = matchingItem.id;
      filteredItems.push(item);
    } else {
      item['status'] = 0;
      nonMatchingItems.push(item);
    }
  });

  return {
    filteredItems,
    nonMatchingItems,
  };
}

export function filterListAttendee(
  rsAttendees: AttendeeList,
  lstNonAttendees: string[],
) {
  const filterAttendees: Attendee[] = rsAttendees.filter(
    (a) => !lstNonAttendees.includes(a.ExternalUserId),
  );
  const filterNonAttendees: Attendee[] = rsAttendees.filter((a) =>
    lstNonAttendees.includes(a.ExternalUserId),
  );
  return { filterAttendees, filterNonAttendees };
}

export function detectDomainFlo(arrData: string[], arrDomain: string[]) {
  const nonFloUsers = [];
  const floUsers = arrData.filter((email) => {
    for (const domain of arrDomain) {
      if (email.endsWith(`@${domain}`)) {
        return true;
      }
    }
    nonFloUsers.push(email);
    return false;
  });
  return { floUsers, nonFloUsers };
}

export function filterDuplicateItem(data: any[]) {
  const dataError = [];
  const uniqueArr = data.filter((value, index) => {
    if (data.indexOf(value) === index) {
      return value;
    } else {
      dataError.push(value);
    }
  });
  return { uniqueArr, dataError };
}
export function isUserFlo(email: string) {
  const domainsFlo: string[] = appConfig().floDomain.split(',')
  for (const domain of domainsFlo) {
    if (email.endsWith(`@${domain}`)) {
        return true;
    }
  }
  return false;
}
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
      for (const [key, value] of Object.entries(error.constraints)) {
        message += value + '; ';
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