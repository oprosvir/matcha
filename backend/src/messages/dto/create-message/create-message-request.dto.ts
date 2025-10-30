import { PickType } from "@nestjs/mapped-types";
import { MessageDto } from "../message.dto";

export class CreateMessageRequestDto extends PickType(MessageDto, ['chatId', 'senderId', 'content']) { }
