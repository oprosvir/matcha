import { IsArray, IsNotEmpty, IsUUID } from "class-validator";

export class ReadMessagesRequestDto {
  @IsArray({ message: 'Message IDs must be an array' })
  @IsNotEmpty({ message: 'Message IDs are required' })
  @IsUUID('4', { each: true, message: 'Each message ID must be a valid UUID' })
  messageIds: string[];
}
