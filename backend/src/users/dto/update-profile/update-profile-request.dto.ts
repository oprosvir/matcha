import { IsEnum, IsString, MinLength, MaxLength, IsOptional, Matches, IsEmail } from "class-validator";
import { Transform } from 'class-transformer';
import { Gender } from 'src/users/enums/user.enums';
import { SexualOrientation } from 'src/users/enums/user.enums';

export class UpdateProfileRequestDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @MinLength(2, { message: 'First name must be at least 2 characters long' })
  @MaxLength(50, { message: 'First name must be less than 50 characters long' })
  @Matches(/^[a-zA-ZÀ-ÿ\s\-']+$/, { message: 'First name must contain only letters, spaces, hyphens, and apostrophes' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @MinLength(2, { message: 'Last name must be at least 2 characters long' })
  @MaxLength(50, { message: 'Last name must be less than 50 characters long' })
  @Matches(/^[a-zA-ZÀ-ÿ\s\-']+$/, { message: 'Last name must contain only letters, spaces, hyphens, and apostrophes' })
  lastName?: string;

  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be a valid gender' })
  gender?: Gender;

  @IsOptional()
  @IsEnum(SexualOrientation, { message: 'Sexual orientation must be a valid sexual orientation' })
  sexualOrientation?: SexualOrientation;

  @IsOptional()
  @IsString({ message: 'Biography must be a string' })
  @MinLength(5, { message: 'Biography must be at least 5 characters long' })
  @MaxLength(500, { message: 'Biography must be less than 500 characters long' })
  biography?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @MinLength(5, { message: 'Email must be at least 5 characters long' })
  @MaxLength(100, { message: 'Email must be less than 100 characters long' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;
}
