import { IsArray, IsNotEmpty, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { MessageDto } from "../message.dto";

export class FindAllByChatIdResponseDto {
  @IsArray({ message: 'Messages must be an array' })
  @IsNotEmpty({ message: 'Messages is required' })
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
}
