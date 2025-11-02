import { IsNotEmpty, IsEmail } from 'class-validator';

export class SendPasswordResetEmailRequestDto {
  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}