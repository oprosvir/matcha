import { Type } from "class-transformer";
import { PrivateUserDto } from "../user.dto";

export class UpdateProfileResponseDto {
  @Type(() => PrivateUserDto)
  user: PrivateUserDto;
  emailChanged?: boolean;
}
