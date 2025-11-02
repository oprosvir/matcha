import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, ValidateNested } from "class-validator";
import { ConversationDto } from "../conversation.dto";

export class FindAllConversationsResponseDto {
  @IsArray({ message: 'Conversations must be an array' })
  @IsNotEmpty({ message: 'Conversations is required' })
  @ValidateNested({ each: true })
  @Type(() => ConversationDto)
  conversations: ConversationDto[];
}
