import { Type } from "class-transformer";
import { PrivateUserDto } from "../user.dto";

export class GetCurrentUserResponseDto {
  @Type(() => PrivateUserDto)
  user: PrivateUserDto;
}
