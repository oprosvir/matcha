import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ChatDto {
  @IsUUID(4, { message: 'ID must be a valid UUID' })
  @IsNotEmpty({ message: 'ID is required' })
  id: string;

  @IsUUID(4, { message: 'User 1 ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User 1 ID is required' })
  user1Id: string;

  @IsUUID(4, { message: 'User 2 ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User 2 ID is required' })
  user2Id: string;

  @IsString({ message: 'Created at must be a string' })
  @IsNotEmpty({ message: 'Created at is required' })
  createdAt: Date;
}
