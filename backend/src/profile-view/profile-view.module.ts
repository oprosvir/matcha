import { Module } from '@nestjs/common';
import { ProfileViewService } from './profile-view.service';

@Module({
  providers: [ProfileViewService],
})
export class ProfileViewModule { }
