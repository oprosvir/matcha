import { Module, forwardRef } from '@nestjs/common';
import { EventService } from './event.service';
import { EventGateway } from './event.gateway';
import { MessagesModule } from '../messages/message.module';
import { UserModule } from '../users/user.module';
import { WebSocketEmitter } from './web-socket-emitter';

@Module({
  imports: [forwardRef(() => MessagesModule), forwardRef(() => UserModule)],
  providers: [EventService, EventGateway, WebSocketEmitter],
  exports: [EventGateway, WebSocketEmitter],
})
export class EventModule { }
