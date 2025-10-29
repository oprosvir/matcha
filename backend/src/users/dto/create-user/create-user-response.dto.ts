import { Type } from "class-transformer";
import { PrivateUserDto } from "../user.dto";
import { ValidateNested } from "class-validator";

export class CreateUserResponseDto {
  @ValidateNested({ each: true })
  @Type(() => PrivateUserDto)
  user: PrivateUserDto;
}
