import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UsersRepository } from './repositories/users.repository';
import { LikesRepository } from './repositories/likes.repository';
import { DatabaseModule } from '../database/database.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => ChatModule)],
  controllers: [UserController],
  providers: [UserService, UsersRepository, LikesRepository],
  exports: [UserService, UsersRepository],
})
export class UserModule { }
