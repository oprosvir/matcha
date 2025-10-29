import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { UpdateProfileRequestDto } from './dto/update-profile/update-profile-request.dto';
import { UpdateProfileResponseDto } from './dto/update-profile/update-profile-response.dto';
import { FindAllMatchesResponseDto } from './dto/find-all-matches/find-all-matches-response.dto';
import { LikeUserRequestDto } from './dto/like-user/like-user-request.dto';
import { PrivateUserDto } from './dto/user.dto';
import { GetCurrentUserResponseDto } from './dto/get-current-user/get-current-user-response.dto';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser('sub') userId: string): Promise<{ success: boolean, data: GetCurrentUserResponseDto, messageKey: string }> {
    const user: PrivateUserDto = await this.userService.findById(userId);
    return { success: true, data: { user: user }, messageKey: 'SUCCESS_GET_CURRENT_USER' };
  }

  @Put('me')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() updateProfileDto: UpdateProfileRequestDto,
  ): Promise<{ success: boolean, data: UpdateProfileResponseDto, messageKey: string }> {
    const user: UpdateProfileResponseDto = await this.userService.updateProfile(userId, updateProfileDto);
    return { success: true, data: user, messageKey: 'SUCCESS_PROFILE_UPDATED' };
  }

  @Get('matches')
  @UseGuards(AuthGuard)
  async findAllMatches(@CurrentUser('sub') userId: string): Promise<{ success: boolean, data: FindAllMatchesResponseDto, messageKey: string }> {
    const matches: FindAllMatchesResponseDto = await this.userService.findAllMatches(userId);
    return { success: true, data: matches, messageKey: 'SUCCESS_FIND_ALL_MATCHES' };
  }

  @Post('like')
  @UseGuards(AuthGuard)
  async likeUser(@CurrentUser('sub') userId: string, @Body() likeUserRequestDto: LikeUserRequestDto) {
    await this.userService.likeUser(userId, likeUserRequestDto.userId);
    return { success: true, messageKey: 'SUCCESS_LIKE_USER' };
  }
}
