import { CreateUserRequestDto } from "../create-user/create-user-request.dto";
import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsString, MinLength, MaxLength, IsOptional } from "class-validator";
import { Gender } from 'src/users/enums/user.enums';
import { SexualOrientation } from 'src/users/enums/user.enums';

export class UpdateProfileRequestDto extends PartialType(CreateUserRequestDto) {
  @IsOptional()
  @IsEnum(Gender, { message: 'Gender must be a valid gender' })
  gender: Gender;

  @IsOptional()
  @IsEnum(SexualOrientation, { message: 'Sexual orientation must be a valid sexual orientation' })
  sexualOrientation: SexualOrientation;

  @IsOptional()
  @IsString({ message: 'Biography must be a string' })
  @MinLength(5, { message: 'Biography must be at least 5 characters long' })
  @MaxLength(500, { message: 'Biography must be less than 500 characters long' })
  biography: string;
}
