import { IsString, MinLength, MaxLength, IsEmail, Matches, IsNotEmpty } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators';
import { Transform } from 'class-transformer';

export class CreateUserRequestDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MinLength(5, { message: 'Email must be at least 5 characters long' })
  @MaxLength(100, { message: 'Email must be less than 100 characters long' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @IsStrongPassword()
  password: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must be less than 50 characters long' })
  @Matches(/^[a-zA-ZÀ-ÿ\s\-']+$/, { message: 'First name must contain only letters, spaces, hyphens, and apostrophes' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must be less than 50 characters long' })
  @Matches(/^[a-zA-ZÀ-ÿ\s\-']+$/, { message: 'Last name must contain only letters, spaces, hyphens, and apostrophes' })
  lastName: string;

  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username must be less than 50 characters long' })
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Username must contain only letters and numbers' })
  username: string;
}
