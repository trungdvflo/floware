import {
  isArray,
  isEmail,
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { format } from 'util';

export function IsListEmail(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsListEmail',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(emails: string[], args: ValidationArguments) {
          if (isArray(emails) && !emails.length) {
            return true;
          }
          for (const email of emails) {
            if (!isEmail(email)) {
              return false;
            }
          }
          return true;
        },
        defaultMessage: (args: ValidationArguments) => {
          return format('%s must be empty list or list of emails', args.property);
        },
      },
    });
  };
}

export function IsNotDuplicateValue(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsNotDuplicateValue',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(emails: string[], args: ValidationArguments) {
          if (isArray(emails) && !emails.length) {
            return true;
          }
          return new Set(emails).size === emails.length;
        },
        defaultMessage: (args: ValidationArguments) => {
          return format('%s must be not duplicate data', args.property);
        },
      },
    });
  };
}
