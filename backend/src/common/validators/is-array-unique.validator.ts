import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsArrayUnique(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isArrayUnique',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!Array.isArray(value)) return false;

          const uniqueSet = new Set(value);
          return uniqueSet.size === value.length;
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must contain only unique values`;
        },
      },
    });
  };
}
