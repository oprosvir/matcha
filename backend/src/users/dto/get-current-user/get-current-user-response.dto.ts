import { Type } from "class-transformer";
import { PrivateUserDto } from "../user.dto";
import { ValidateNested } from "class-validator";

export class GetCurrentUserResponseDto {
  @ValidateNested({ each: true })
  @Type(() => PrivateUserDto)
  user: PrivateUserDto;
}