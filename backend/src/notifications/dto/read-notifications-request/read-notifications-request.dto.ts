import { IsArray, IsNotEmpty, IsUUID } from "class-validator";

export class ReadNotificationsRequestDto {
  @IsArray({ message: 'Notification IDs must be an array' })
  @IsNotEmpty({ message: 'Notification IDs is required' })
  @IsUUID('4', { each: true, message: 'Each notification ID must be a valid UUID' })
  notificationIds: string[];
}