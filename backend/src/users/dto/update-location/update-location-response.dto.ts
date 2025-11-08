import { Type } from "class-transformer";
import { PrivateUserDto } from "../user.dto";

export class UpdateLocationResponseDto {
  @Type(() => PrivateUserDto)
  user: PrivateUserDto;
}
