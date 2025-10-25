import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class SendMessageDto {
  @IsUUID(4, { message: 'Chat ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Chat ID is required' })
  chatId: string;

  @IsUUID(4, { message: 'To user ID must be a valid UUID' })
  @IsNotEmpty({ message: 'To user ID is required' })
  toUserId: string;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  content: string;
}
