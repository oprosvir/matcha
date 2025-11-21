import { IsNotEmpty, IsNumber, IsObject, IsString, IsUUID } from "class-validator";
import { UserPreviewDto } from "src/users/dto/user-preview.dto";

export class ConversationDto {
  @IsUUID(4, { message: 'Chat ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Chat ID is required' })
  chatId: string; // Chat ID

  @IsObject({ message: 'Profile must be an object' })
  @IsNotEmpty({ message: 'Profile is required' })
  profilePreview: UserPreviewDto;

  @IsString({ message: 'Created at must be a string' })
  @IsNotEmpty({ message: 'Created at is required' })
  createdAt: Date;

  @IsNumber({}, { message: 'Unread count must be a number' })
  @IsNotEmpty({ message: 'Unread count is required' })
  unreadCount: number;
}
