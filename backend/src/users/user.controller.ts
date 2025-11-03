import { Body, Controller, Get, Post, Put, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorators';
import {
  UpdateProfileRequestDto,
  CompleteProfileRequestDto,
  GetCurrentUserResponseDto,
  UpdateProfileResponseDto,
  CompleteProfileResponseDto
} from './dto';
import { PrivateUserDto } from './dto';
import { FindAllMatchesResponseDto } from './dto/find-all-matches/find-all-matches-response.dto';
import { LikeUserRequestDto } from './dto/like-user/like-user-request.dto';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('me')
  @UseGuards(AuthGuard)
  async getCurrentUser(@CurrentUser('sub') userId: string): Promise<{ success: boolean, data: GetCurrentUserResponseDto, messageKey: string }> {
    const user: PrivateUserDto | null = await this.userService.findById(userId);
    if (!user) throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    return { success: true, data: { user: user }, messageKey: 'SUCCESS_GET_CURRENT_USER' };
  }

  @Post('me/complete')
  @UseGuards(AuthGuard)
  async completeProfile(
    @CurrentUser('sub') userId: string,
    @Body() completeProfileDto: CompleteProfileRequestDto,
  ): Promise<{ success: boolean, data: CompleteProfileResponseDto, messageKey: string }> {
    const result: CompleteProfileResponseDto = await this.userService.completeProfile(userId, completeProfileDto);
    return { success: true, data: result, messageKey: 'SUCCESS_PROFILE_COMPLETED' };
  }

  @Put('me')
  @UseGuards(AuthGuard)
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() updateProfileDto: UpdateProfileRequestDto,
  ): Promise<{ success: boolean, data: UpdateProfileResponseDto, messageKey: string }> {
    const result: UpdateProfileResponseDto = await this.userService.updateProfile(userId, updateProfileDto);
    return { success: true, data: result, messageKey: 'SUCCESS_PROFILE_UPDATED' };
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

  @Get('resolve-location-by-latitude-and-longitude')
  async resolveLocationByLatitudeAndLongitude(@Query('latitude') latitude: number, @Query('longitude') longitude: number): Promise<{ success: boolean, data: { cityName: string, countryName: string }, messageKey: string }> {
    const location: { cityName: string, countryName: string } = await this.userService.resolveCityNameAndCountryNameByLatitudeAndLongitude(latitude, longitude);
    return { success: true, data: { cityName: location.cityName, countryName: location.countryName }, messageKey: 'SUCCESS_RESOLVE_LOCATION' };
  }

  @Get('resolve-location-by-city-name-and-country-name')
  async resolveLocationByCityNameAndCountryName(@Query('cityName') cityName: string, @Query('countryName') countryName: string): Promise<{ success: boolean, data: { longitude: number, latitude: number }, messageKey: string }> {
    const location: { longitude: number, latitude: number } = await this.userService.resolveLongitudeAndLatitudeByCityNameAndCountryName(cityName, countryName);
    return { success: true, data: { longitude: location.longitude, latitude: location.latitude }, messageKey: 'SUCCESS_RESOLVE_LOCATION' };
  }

  @Get('resolve-location-by-ip-address')
  async resolveLocationByIPAddress(@Query('ipAddress') ipAddress: string): Promise<{ success: boolean, data: { longitude: number, latitude: number }, messageKey: string }> {
    const location: { longitude: number, latitude: number } = await this.userService.resolveLongitudeAndLatitudeByIPAddress(ipAddress);
    return { success: true, data: { longitude: location.longitude, latitude: location.latitude }, messageKey: 'SUCCESS_RESOLVE_LOCATION' };
  }
}
