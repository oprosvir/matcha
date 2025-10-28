import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsMinAge(minAge: number, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isMinAge',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [minAge],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          const [minAge] = args.constraints;
          const birthDate = new Date(value);
          const today = new Date();

          if (isNaN(birthDate.getTime())) { return false; }
          if (birthDate > today) { return false; }

          const age = today.getFullYear() - birthDate.getFullYear();
          const hasBirthdayPassed =
            today.getMonth() > birthDate.getMonth() ||
            (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
          
          const actualAge = hasBirthdayPassed ? age : age - 1;
          return actualAge >= minAge;
        },
        defaultMessage(args: ValidationArguments) {
          return `You must be at least ${args.constraints[0]} years old`;
        },
      },
    });
  };
}
