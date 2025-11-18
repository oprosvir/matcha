import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { UserPreviewDto } from "../user-preview.dto";

export class LikeSentItemDto {
  id: string;
  likedAt: string;
  @ValidateNested()
  @Type(() => UserPreviewDto)
  liked: UserPreviewDto;
}

export class FindAllLikesSentResponseDto {
  @ValidateNested({ each: true })
  @Type(() => LikeSentItemDto)
  likes: LikeSentItemDto[];
}
