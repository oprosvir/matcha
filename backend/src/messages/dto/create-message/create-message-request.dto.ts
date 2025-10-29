import { PickType } from "@nestjs/mapped-types";
import { MessageDto } from "../message.dto";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateMessageRequestDto extends PickType(MessageDto, ['chatId', 'senderId', 'content']) {
  @IsString({ message: 'From user socket ID must be a string' })
  @IsNotEmpty({ message: 'From user socket ID is required' })
  senderSocketId: string;
}
