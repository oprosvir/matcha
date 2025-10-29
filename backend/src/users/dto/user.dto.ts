import { IsUUID, IsNotEmpty, IsString, IsEnum, IsNumber, IsDateString, IsArray, IsInt, IsDecimal, IsBoolean } from "class-validator";
import { Gender, SexualOrientation } from "../enums/user.enums";

export class UserPhotoDto {
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  @IsNotEmpty({ message: 'ID is required' })
  id: string;

  @IsString({ message: 'URL must be a string' })
  @IsNotEmpty({ message: 'URL is required' })
  url: string;

  @IsBoolean({ message: 'Is profile picture must be a boolean' })
  @IsNotEmpty({ message: 'Is profile picture is required' })
  isProfilePic: boolean;
}

export class UserInterestDto {
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  @IsNotEmpty({ message: 'ID is required' })
  id: string;

  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;
}

export class PublicUserDto {
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  @IsNotEmpty({ message: 'ID is required' })
  id: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsEnum(Gender, { message: 'Gender must be a valid gender' })
  @IsNotEmpty({ message: 'Gender is required' })
  gender: Gender | null;

  @IsString({ message: 'Biography must be a string' })
  @IsNotEmpty({ message: 'Biography is required' })
  biography: string | null;

  @IsInt({ message: 'Fame rating must be an integer' })
  @IsNotEmpty({ message: 'Fame rating is required' })
  fameRating: number;

  @IsDecimal()
  @IsNotEmpty({ message: 'Latitude is required' })
  latitude: number | null;

  @IsDecimal()
  @IsNotEmpty({ message: 'Longitude is required' })
  longitude: number | null;

  @IsString({ message: 'Last time active must be a string' })
  @IsNotEmpty({ message: 'Last time active is required' })
  lastTimeActive: string | null;

  @IsDateString({}, { message: 'Created at must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Created at is required' })
  createdAt: string;

  @IsArray({ message: 'Photos must be an array' })
  photos: UserPhotoDto[];

  @IsArray({ message: 'Interests must be an array' })
  interests: UserInterestDto[];
}

export class PrivateUserDto extends PublicUserDto {
  @IsString({ message: 'Email must be a string' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username is required' })
  username: string;

  @IsBoolean({ message: 'Is email verified must be a boolean' })
  @IsNotEmpty({ message: 'Is email verified is required' })
  isEmailVerified: boolean;

  @IsEnum(SexualOrientation, { message: 'Sexual orientation must be a valid sexual orientation' })
  @IsNotEmpty({ message: 'Sexual orientation is required' })
  sexualOrientation: SexualOrientation;
}