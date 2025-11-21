import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { ReadNotificationsRequestDto, FindAllNotificationsResponseDto } from './dto';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get()
  @UseGuards(AuthGuard)
  async findAllNotifications(@CurrentUser('sub') userId: string): Promise<{ success: boolean, data: FindAllNotificationsResponseDto, messageKey: string }> {
    const notifications = await this.notificationService.findAllNotifications(userId);
    return { success: true, data: { notifications }, messageKey: 'SUCCESS_FIND_ALL_NOTIFICATIONS' };
  }

  @Post('read')
  @UseGuards(AuthGuard)
  async readNotifications(@CurrentUser('sub') userId: string, @Body() readNotificationsRequestDto: ReadNotificationsRequestDto) {
    await this.notificationService.readNotifications(userId, readNotificationsRequestDto);
    return { success: true, messageKey: 'SUCCESS_READ_NOTIFICATION' };
  }
}
