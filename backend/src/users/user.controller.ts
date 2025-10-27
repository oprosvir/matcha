import { BadRequestException, Body, Controller, Get, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser('sub') userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.BAD_REQUEST);
    return { success: true, data: user, messageKey: 'SUCCESS_GET_CURRENT_USER' };
  }

  @Put('me')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const user = await this.userService.updateProfile(userId, updateProfileDto);
    return { success: true, data: user, messageKey: 'SUCCESS_PROFILE_UPDATED' };
  }

  @Get('matches')
  @UseGuards(AuthGuard)
  async findAllMatches(@CurrentUser('sub') userId: string) {
    const matches = await this.userService.findAllMatches(userId);
    return { success: true, data: matches, messageKey: 'SUCCESS_FIND_ALL_MATCHES' };
  }

  @Post('like')
  @UseGuards(AuthGuard)
  async likeUser(@CurrentUser('sub') userId: string, @Body() userLikedId: string) {
    await this.userService.likeUser(userId, userLikedId);
    return { success: true, messageKey: 'SUCCESS_LIKE_USER' };
  }
}
