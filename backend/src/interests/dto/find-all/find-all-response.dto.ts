import { IsArray, IsNotEmpty } from "class-validator";
import { GetByIdResponseDto } from "../get-by-id/get-by-id-response";

export class FindAllResponseDto {
  @IsArray({ message: 'Interests must be an array' })
  @IsNotEmpty({ message: 'Interests is required' })
  interests: GetByIdResponseDto[];
}