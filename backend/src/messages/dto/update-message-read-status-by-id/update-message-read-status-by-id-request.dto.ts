import { PickType } from "@nestjs/mapped-types";
import { MessageDto } from "../message.dto";

export class UpdateMessageReadStatusByIdRequestDto extends PickType(MessageDto, ['id', 'isRead']) { }