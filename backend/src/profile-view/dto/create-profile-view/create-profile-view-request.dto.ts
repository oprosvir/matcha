import { IsUUID } from "class-validator";
import { IsNotEmpty } from "class-validator";

export class CreateProfileViewRequestDto {
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;
}
