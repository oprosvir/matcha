import { Module } from '@nestjs/common';
import { MessagesRepository } from './repositories/message.repository';

@Module({
  imports: [MessagesRepository],
})
export class MessagesModule { }
