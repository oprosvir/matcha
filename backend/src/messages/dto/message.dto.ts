import { IsNotEmpty, IsUUID, MaxLength } from "class-validator";
import { IsString } from "class-validator";
import { IsDateString } from "class-validator";
import { IsBoolean } from "class-validator";

export class MessageDto {
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  @IsNotEmpty({ message: 'ID is required' })
  id: string;

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

  @IsDateString({}, { message: 'Created at must be a valid ISO 8601 date string' })
  @IsNotEmpty({ message: 'Created at is required' })
  createdAt: string;

  @IsBoolean({ message: 'Is read must be a boolean' })
  @IsNotEmpty({ message: 'Is read is required' })
  isRead: boolean;
}
