import { IsNotEmpty, IsUUID, MaxLength, IsString } from "class-validator";

export class CreateMessageRequestDto {
  @IsUUID(4, { message: 'Chat ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Chat ID is required' })
  chatId: string;

  @IsUUID(4, { message: 'Sender ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Sender ID is required' })
  senderId: string;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MaxLength(1000, { message: 'Content cannot exceed 1000 characters' })
  content: string;
}
