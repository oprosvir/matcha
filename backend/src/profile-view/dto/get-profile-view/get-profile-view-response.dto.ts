import { ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { UserPreviewDto } from "src/users/dto/user-preview.dto";

export class GetProfileViewResponseDto {
  @ValidateNested({ each: true })
  @Type(() => UserPreviewDto)
  users: UserPreviewDto[];
}
