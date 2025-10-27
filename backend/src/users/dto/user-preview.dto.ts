import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class UserPreviewDto {
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  @IsNotEmpty({ message: 'ID is required' })
  id: string;

  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @IsString({ message: 'Profile picture must be a string' })
  @IsNotEmpty({ message: 'Profile picture is required' })
  profilePicture: string;
}
