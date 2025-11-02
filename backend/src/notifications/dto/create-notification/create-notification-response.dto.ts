import { IsBoolean, IsEnum, IsNotEmpty, IsString, IsUUID } from "class-validator";
import { NotificationType } from "src/common/enums/notification-type";

export class CreateNotificationResponseDto {
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  @IsNotEmpty({ message: 'ID is required' })
  id: string;

  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsEnum(NotificationType, { message: 'Notification type must be a valid notification type' })
  @IsNotEmpty({ message: 'Notification type is required' })
  type: NotificationType;

  @IsUUID(4, { message: 'Source user ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Source user ID is required' })
  sourceUserId: string;

  @IsBoolean({ message: 'Read must be a boolean' })
  @IsNotEmpty({ message: 'Read is required' })
  read: boolean;

  @IsString({ message: 'Created at must be a string' })
  @IsNotEmpty({ message: 'Created at is required' })
  createdAt: string;
}