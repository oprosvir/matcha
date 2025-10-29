import { PublicUserDto } from "./user.dto";
import { PickType } from "@nestjs/mapped-types";
import { IsString, IsNotEmpty, IsUrl } from "class-validator";

export class UserPreviewDto extends PickType(PublicUserDto, ['id', 'firstName', 'lastName'] as const) {
  @IsString({ message: 'Profile picture must be a string' })
  @IsNotEmpty({ message: 'Profile picture is required' })
  @IsUrl()
  profilePicture: string;
}
