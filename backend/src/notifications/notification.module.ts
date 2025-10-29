import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationRepository } from './repositories/notification.repository';
import { DatabaseModule } from '../database/database.module';
import { UserModule } from '../users/user.module';
import { EventModule } from '../event/event.module';
import { NotificationController } from './notification.controller';

@Module({
  imports: [DatabaseModule, UserModule, EventModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationRepository],
  exports: [NotificationService, NotificationRepository],
})
export class NotificationModule { }