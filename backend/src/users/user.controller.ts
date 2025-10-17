import { BadRequestException, Controller, Get, HttpStatus, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser('sub') userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new BadRequestException(new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.BAD_REQUEST));
    return { success: true, data: user, messageKey: 'SUCCESS_GET_CURRENT_USER' };
  }
}
