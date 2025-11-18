import { IsArray, IsNotEmpty, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { PublicUserDto } from "../user.dto";

export class FindAllMatchesResponseDto {
  @IsArray({ message: 'Users must be an array' })
  @IsNotEmpty({ message: 'Users is required' })
  @ValidateNested({ each: true })
  @Type(() => PublicUserDto)
  users: PublicUserDto[];
}