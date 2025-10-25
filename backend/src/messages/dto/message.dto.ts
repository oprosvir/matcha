import { IsBoolean, IsNotEmpty, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsUUID(4, { message: 'Chat ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Chat ID is required' })
  chatId: string;

  @IsUUID(4, { message: 'Sender ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Sender ID is required' })
  senderId: string;

  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content is required' })
  @MinLength(1, { message: 'Content cannot be empty' })
  @MaxLength(1000, { message: 'Content cannot exceed 1000 characters' })
  content: string;
}

export class ReadMessageDto {
  @IsUUID(4, { message: 'Message ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Message ID is required' })
  messageId: string;
}

export class MessageResponseDto {
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
  content: string;

  @IsString({ message: 'Created at must be a string' })
  @IsNotEmpty({ message: 'Created at is required' })
  createdAt: string;

  @IsBoolean({ message: 'Is read must be a boolean' })
  @IsNotEmpty({ message: 'Is read is required' })
  isRead: boolean;
}
