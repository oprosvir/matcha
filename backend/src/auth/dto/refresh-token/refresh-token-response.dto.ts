import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenResponseDto {
  @IsString({ message: 'Access token must be a string' })
  @IsNotEmpty({ message: 'Access token is required' })
  accessToken: string;
}
