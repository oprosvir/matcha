import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { NotificationType } from "src/common/enums/notification-type";

export class CreateNotificationRequestDto {
  @IsUUID(4, { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @IsEnum(NotificationType, { message: 'Notification type must be a valid notification type' })
  @IsNotEmpty({ message: 'Notification type is required' })
  type: NotificationType;

  @IsUUID(4, { message: 'Source user ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Source user ID is required' })
  sourceUserId: string;
}
