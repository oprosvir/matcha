import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PhotosController } from './photos.controller';
import { UsersRepository } from './repositories/users.repository';
import { LikesRepository } from './repositories/likes.repository';
import { BlocksRepository } from './repositories/blocks.repository';
import { ReportsRepository } from './repositories/reports.repository';
import { PhotosRepository } from './repositories/photos.repository';
import { PhotosService } from './photos.service';
import { DatabaseModule } from '../database/database.module';
import { InterestModule } from '../interests/interest.module';
import { ChatModule } from '../chat/chat.module';
import { NotificationModule } from '../notifications/notification.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [DatabaseModule, InterestModule, forwardRef(() => ChatModule), forwardRef(() => NotificationModule), RedisModule],
  controllers: [UserController, PhotosController],
  providers: [UserService, PhotosService, UsersRepository, LikesRepository, BlocksRepository, ReportsRepository, PhotosRepository],
  exports: [UserService, PhotosService, UsersRepository, BlocksRepository, PhotosRepository],
})
export class UserModule { }
