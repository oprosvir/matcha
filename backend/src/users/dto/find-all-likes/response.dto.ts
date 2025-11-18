import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { UserPreviewDto } from "../user-preview.dto";

export class LikeItemDto {
  id: string;
  likedAt: string;
  @ValidateNested()
  @Type(() => UserPreviewDto)
  liker: UserPreviewDto;
}

export class FindAllLikesResponseDto {
  @ValidateNested({ each: true })
  @Type(() => LikeItemDto)
  likes: LikeItemDto[];
}
