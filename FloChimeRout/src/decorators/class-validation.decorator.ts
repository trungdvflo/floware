import {
    IsOptional as IsOptionalValidator,
    ValidateIf,
    ValidationOptions
} from 'class-validator';
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
  