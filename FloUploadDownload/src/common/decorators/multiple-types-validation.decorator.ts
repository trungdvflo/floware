import {
  isInt, isNumber, isString, registerDecorator, ValidationArguments,
  ValidationOptions
} from 'class-validator';

const typeValidator = {
  "string"(value: any, args: ValidationArguments) {
    return isString(value);
  },
  "int"(value: any, args: ValidationArguments) {
    return isInt(value);
  },
  "number"(value: any, args: ValidationArguments) {
    return isNumber(value);
  }
  // Add more here
};

export function IsType(types: (keyof (typeof typeValidator))[],
  validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'wrongType',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return types.some(v => typeValidator[v](value, args));
        },
        defaultMessage(validationArguments?: ValidationArguments) {
          const clonedTypes = [...types];
          const lastType = clonedTypes.pop();
          if (clonedTypes.length === 0)
            return `Has to be ${lastType}`;
          return `Can only be ${clonedTypes.join(", ")} or ${lastType}.`;
        }
      }
    });
  };
}