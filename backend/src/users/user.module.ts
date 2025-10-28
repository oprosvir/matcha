import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UsersRepository } from './repositories/users.repository';
import { DatabaseModule } from '../database/database.module';
import { InterestModule } from '../interests/interest.module';

@Module({
  imports: [DatabaseModule, InterestModule],
  controllers: [UserController],
  providers: [UserService, UsersRepository],
  exports: [UserService],
})
export class UserModule { }
