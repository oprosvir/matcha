import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from 'src/database/database.module';
import { ChatRepository } from './repositories/chat.repository';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { UserModule } from '../users/user.module';

@Module({
  imports: [DatabaseModule, forwardRef(() => UserModule)],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository],
  exports: [ChatRepository, ChatService],
})
export class ChatModule { }