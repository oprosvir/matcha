import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ChatDto {
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  @IsNotEmpty({ message: 'ID is required' })
  id: string;

  @IsUUID(4, { message: 'User 1 ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User 1 ID is required' })
  user1_id: string;

  @IsUUID(4, { message: 'User 2 ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User 2 ID is required' })
  user2_id: string;

  @IsString({ message: 'Created at must be a string' })
  @IsNotEmpty({ message: 'Created at is required' })
  created_at: Date;
}
