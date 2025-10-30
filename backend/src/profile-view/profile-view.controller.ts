import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ProfileViewService } from './profile-view.service';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { AuthGuard } from 'src/auth/auth.guard';
import { CreateProfileViewRequestDto } from './dto/create-profile-view/create-profile-view-request.dto';
import { GetProfileViewResponseDto as ProfileViewResponseDto } from './dto/get-profile-view/get-profile-view-response.dto';

@Controller()
export class ProfileViewController {
  constructor(private readonly profileViewService: ProfileViewService) { }

  @Get('profile-views')
  @UseGuards(AuthGuard)
  async getProfileViews(@CurrentUser('sub') userId: string): Promise<{ success: boolean, data: ProfileViewResponseDto, messageKey: string }> {
    const profileViews: ProfileViewResponseDto = await this.profileViewService.getProfileViews(userId);
    return { success: true, data: profileViews, messageKey: 'SUCCESS_GET_PROFILE_VIEWS' };
  }

  @Post('profile-views')
  @UseGuards(AuthGuard)
  async createProfileView(@CurrentUser('sub') userId: string, @Body() createProfileViewRequestDto: CreateProfileViewRequestDto) {
    await this.profileViewService.createProfileView(userId, createProfileViewRequestDto);
    return { success: true, messageKey: 'SUCCESS_CREATE_PROFILE_VIEW' };
  }
}
