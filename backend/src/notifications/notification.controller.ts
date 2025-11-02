import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { type NotificationEvent } from './notification.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { ReadNotificationsRequestDto } from './dto/read-notifications-request/read-notifications-request.dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  // TODO: Create DTOs for that
  @Get()
  @UseGuards(AuthGuard)
  async findAllNotifications(@CurrentUser('sub') userId: string) {
    const notifications: NotificationEvent[] = await this.notificationService.findAllNotifications(userId);
    return { success: true, data: { notifications: notifications }, messageKey: 'SUCCESS_FIND_ALL_NOTIFICATIONS' };
  }

  @Post('read')
  @UseGuards(AuthGuard)
  async readNotifications(@CurrentUser('sub') userId: string, @Body() readNotificationsRequestDto: ReadNotificationsRequestDto) {
    await this.notificationService.readNotifications(userId, readNotificationsRequestDto);
    return { success: true, messageKey: 'SUCCESS_READ_NOTIFICATION' };
  }
}
