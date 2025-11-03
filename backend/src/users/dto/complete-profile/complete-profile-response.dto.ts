import { Type } from "class-transformer";
import { PrivateUserDto } from "../user.dto";

export class CompleteProfileResponseDto {
  @Type(() => PrivateUserDto)
  user: PrivateUserDto;
}
