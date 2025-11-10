import { registerDecorator, ValidationArguments } from 'class-validator';
import { getWordsList } from 'most-common-words-by-language';

const COMMON_WORDS = new Set(
  getWordsList('english', 10000).filter(w => w.length >= 3).map((word) => word.toLowerCase())
);

const RULES = [
  { test: (v: string) => v.length >= 12, message: 'Password must be at least 12 characters long' },
  { test: (v: string) => /[a-z]/.test(v), message: 'Password must contain at least one lowercase letter' },
  { test: (v: string) => /[A-Z]/.test(v), message: 'Password must contain at least one uppercase letter' },
  { test: (v: string) => /\d/.test(v), message: 'Password must contain at least one number' },
  {
    test: (v: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(v),
    message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;":\\|,.<>/?)'
  },
  {
    test: (v: string) => {
      const lowercase = v.toLowerCase();
      return !Array.from(COMMON_WORDS).some((word: string) => lowercase.includes(word));
    },
    message: 'Password contains common English words. Please choose a more unique password',
  },
];

export function IsStrongPassword() {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string' || value.trim() === '') return false;
          return RULES.every((r) => r.test(value));
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value;

          if (typeof value !== 'string' || value.trim() === '')
            return 'Password is required';

          const failed = RULES.find((r) => !r.test(value));
          return failed?.message ?? 'Invalid password format';
        },
      },
    });
  };
}
