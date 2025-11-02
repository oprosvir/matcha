import { IsNotEmpty, IsObject, ValidateNested } from "class-validator";
import { MessageDto } from "../message.dto";

export class CreateMessageResponseDto {
  @IsObject({ message: 'Message must be an object' })
  @IsNotEmpty({ message: 'Message is required' })
  @ValidateNested()
  message: MessageDto;
}
