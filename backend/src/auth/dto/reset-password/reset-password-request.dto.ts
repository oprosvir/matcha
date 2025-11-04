import { IsNotEmpty, IsString } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators';

export class ResetPasswordRequestDto {
  @IsString({ message: 'Token must be a string' })
  @IsNotEmpty({ message: 'Token is required' })
  token: string;

  @IsStrongPassword()
  password: string;
}
