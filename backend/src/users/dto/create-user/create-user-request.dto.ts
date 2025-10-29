import { IsString, MinLength, MaxLength, IsEmail, Matches, IsNotEmpty } from 'class-validator';

export class CreateUserRequestDto {
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be a valid email address' })
  email: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: 'Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;":\\|,.<>/?)' })
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
