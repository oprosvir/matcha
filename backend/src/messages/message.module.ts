import { Module, forwardRef } from '@nestjs/common';
import { MessagesRepository } from './repositories/message.repository';
import { MessagesService } from './message.service';
import { MessageController } from './message.controller';
import { DatabaseModule } from '../database/database.module';
import { ChatModule } from '../chat/chat.module';
import { EventModule } from '../event/event.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => ChatModule), forwardRef(() => EventModule)],
  controllers: [MessageController],
  providers: [MessagesService, MessagesRepository],
  exports: [MessagesService, MessagesRepository],
})
export class MessagesModule { }
