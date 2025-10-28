import { IsString, MinLength, MaxLength, IsEnum, IsDateString, IsNotEmpty } from 'class-validator';
import { Gender, SexualOrientation } from '../enums/user.enums';
import { IsMinAge } from '../validators/min-age.validator';

export class CompleteProfileDto {
  @IsDateString()
  @IsNotEmpty()
  @IsMinAge(18)
  dateOfBirth: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsEnum(SexualOrientation)
  sexualOrientation: SexualOrientation;

  @IsString()
  @MinLength(5)
  @MaxLength(500)
  biography: string;
}
