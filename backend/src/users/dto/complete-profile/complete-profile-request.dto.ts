import { IsString, MinLength, MaxLength, IsEnum, IsDateString, IsNotEmpty, IsArray, IsUUID, ArrayMinSize, ArrayMaxSize, IsNumber, Min, Max } from 'class-validator';
import { Gender, SexualOrientation } from '../../enums/user.enums';
import { IsMinAge, IsArrayUnique } from 'src/common/validators';

export class CompleteProfileRequestDto {
  @IsDateString({}, { message: 'Date of birth must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Date of birth is required' })
  @IsMinAge(18)
  dateOfBirth: string;

  @IsEnum(Gender, { message: 'Gender must be a valid gender' })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: Gender;

  @IsEnum(SexualOrientation, { message: 'Sexual orientation must be a valid sexual orientation' })
  @IsNotEmpty({ message: 'Sexual orientation is required' })
  sexualOrientation: SexualOrientation;

  @IsString({ message: 'Biography must be a string' })
  @IsNotEmpty({ message: 'Biography is required' })
  @MinLength(5, { message: 'Biography must be at least 5 characters long' })
  @MaxLength(500, { message: 'Biography must be less than 500 characters long' })
  biography: string;

  @IsArray({ message: 'Interest IDs must be an array' })
  @ArrayMinSize(1, { message: 'At least one interest is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 interests allowed' })
  @IsUUID('4', { each: true, message: 'Each interest ID must be a valid UUID' })
  @IsArrayUnique()
  interestIds: string[];

  @IsNotEmpty({ message: 'Latitude is required' })
  @IsNumber({}, { message: 'Latitude must be a number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude: number;

  @IsNotEmpty({ message: 'Longitude is required' })
  @IsNumber({}, { message: 'Longitude must be a number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude: number;
}
