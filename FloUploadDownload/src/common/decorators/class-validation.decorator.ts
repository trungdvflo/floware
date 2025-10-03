import {
  isEmail,
  isEmpty,
  isEnum,
  isFQDN, isInt,
  isNotEmpty,
  isNumber, IsOptional as IsOptionalValidator, isPositive, isString,
  isUUID,
  registerDecorator, ValidateIf, ValidationArguments, ValidationOptions
} from 'class-validator';
import { format } from 'util';
import { OBJ_TYPE, TRASH_TYPE } from '../constants/common';

export function IsEmailOrEmpty(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'IsEmailOrEmpty',
      target: object.constructor,
      propertyName,
      constraints: [propertyName],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          return isEmpty(value) || isEmail(value);
        },
        defaultMessage: (args: ValidationArguments) => {
          return format('%s must be empty or an email', args.property);
        },
      },
    });
  };
}

/**
 * Checks if value is missing and if so, ignores all validators.
 *
 * @param nullable If `true`, all other validators will be skipped
 * even when the value is `null`. `false` by default.
 * @param validationOptions {@link ValidationOptions}
 *
 * @see IsOptional exported from `class-validator.
 */
export function IsOptionalCustom(
  nullable = false,
  validationOptions?: ValidationOptions,
) {
  if (nullable) {
    return IsOptionalValidator(validationOptions);
  }

  return ValidateIf((ob: any, v: any) => {
    return v !== undefined;
  }, validationOptions);
}
