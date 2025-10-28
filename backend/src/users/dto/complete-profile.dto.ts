import { IsString, MinLength, MaxLength, IsEnum, IsDateString, IsNotEmpty, IsArray, IsInt, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Gender, SexualOrientation } from '../enums/user.enums';
import { IsMinAge } from '../validators/min-age.validator';
import { IsArrayUnique } from 'src/common/validators/is-array-unique.validator';

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
  @ArrayMinSize(1, { message: 'At least one interest is required' })
  @ArrayMaxSize(10, { message: 'Maximum 10 interests allowed' })
  @IsInt({ each: true })
  @IsArrayUnique({ message: 'Interest IDs must be unique' })
  interestIds: number[];
}
