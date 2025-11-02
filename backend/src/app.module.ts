import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { InterestModule } from './interests/interest.module';
import { ChatModule } from './chat/chat.module';
import { NotificationModule } from './notifications/notification.module';
import { EventModule } from './event/event.module';
import { MessagesModule } from './messages/message.module';

@Module({
  imports: [AuthModule, DatabaseModule, InterestModule, ChatModule, NotificationModule, EventModule, MessagesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
