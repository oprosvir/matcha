import { IsString, MinLength, MaxLength, IsEnum, IsDateString, IsNotEmpty, IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Gender, SexualOrientation } from '../enums/user.enums';
import { IsMinAge, IsArrayUnique } from 'src/common/validators';

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

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @IsArrayUnique()
  interestIds: number[];
}
