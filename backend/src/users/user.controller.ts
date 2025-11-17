import { Body, Controller, Get, Post, Put, UseGuards, HttpStatus, Query, Param } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorators';
import {
  UpdateProfileRequestDto,
  CompleteProfileRequestDto,
  GetCurrentUserResponseDto,
  UpdateProfileResponseDto,
  CompleteProfileResponseDto,
  UpdateLocationRequestDto,
  UpdateLocationResponseDto,
  GetPublicProfileResponseDto
} from './dto';
import { PrivateUserDto } from './dto';
import { FindAllMatchesResponseDto } from './dto/find-all-matches/find-all-matches-response.dto';
import { FindAllLikesResponseDto } from './dto/find-all-likes/find-all-likes-response.dto';
import { LikeUserRequestDto } from './dto/like-user/like-user-request.dto';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { GetLocationListResponseDto } from './dto/get-location-list/get-location-list.dto';
import { GetUsersRequestDto } from './dto/get-users/get-users-request.dto';
import { GetUsersResponseDto } from './dto/get-users/get-users-response.dto';
import { GetSuggestedUsersRequestDto } from './dto/get-suggested-users/get-suggested-users-request.dto';

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

  @Get('matches')
  @UseGuards(AuthGuard)
  async findAllMatches(@CurrentUser('sub') userId: string): Promise<{ success: boolean, data: FindAllMatchesResponseDto, messageKey: string }> {
    const matches: FindAllMatchesResponseDto = await this.userService.findAllMatches(userId);
    return { success: true, data: matches, messageKey: 'SUCCESS_FIND_ALL_MATCHES' };
  }

  @Get('likes')
  @UseGuards(AuthGuard)
  async findAllLikes(@CurrentUser('sub') userId: string): Promise<{ success: boolean, data: FindAllLikesResponseDto, messageKey: string }> {
    const likes: FindAllLikesResponseDto = await this.userService.findAllLikes(userId);
    return { success: true, data: likes, messageKey: 'SUCCESS_FIND_ALL_LIKES' };
  }

  @Get('location-list')
  @UseGuards(AuthGuard)
  async getLocationList(@CurrentUser('sub') userId: string): Promise<{ success: boolean, data: GetLocationListResponseDto, messageKey: string }> {
    const locationList: GetLocationListResponseDto = await this.userService.getLocationList(userId);
    return { success: true, data: locationList, messageKey: 'SUCCESS_GET_LOCATION_LIST' };
  }

  @Get('users')
  @UseGuards(AuthGuard)
  async getUsers(
    @CurrentUser('sub') userId: string,
    @Query() getUsersRequestDto: GetUsersRequestDto,
  ): Promise<{ success: boolean, data: GetUsersResponseDto, messageKey: string }> {
    const result: GetUsersResponseDto = await this.userService.getUsers(userId, getUsersRequestDto);
    return { success: true, data: result, messageKey: 'SUCCESS_GET_USERS' };
  }

  @Get('suggested')
  @UseGuards(AuthGuard)
  async getSuggestedUsers(
    @CurrentUser('sub') userId: string,
    @Query() getSuggestedUsersRequestDto: GetSuggestedUsersRequestDto,
  ): Promise<{ success: boolean, data: GetUsersResponseDto, messageKey: string }> {
    const result: GetUsersResponseDto = await this.userService.getSuggestedUsers(userId, getSuggestedUsersRequestDto);
    return { success: true, data: result, messageKey: 'SUCCESS_GET_SUGGESTED_USERS' };
  }

  @Get('resolve-location-by-latitude-and-longitude')
  @UseGuards(AuthGuard)
  async resolveLocationByLatitudeAndLongitude(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
  ): Promise<{ success: boolean; data: { cityName: string; countryName: string }; messageKey: string }> {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      throw new CustomHttpException('INVALID_COORDINATES', 'Invalid latitude or longitude', 'ERROR_INVALID_COORDINATES', HttpStatus.BAD_REQUEST);
    }

    const result = await this.userService.resolveCityNameAndCountryNameByLatitudeAndLongitude(lat, lon);
    return { success: true, data: result, messageKey: 'SUCCESS_RESOLVE_LOCATION' };
  }

  @Get('resolve-location-by-city-name-and-country-name')
  @UseGuards(AuthGuard)
  async resolveLocationByCityNameAndCountryName(
    @Query('cityName') cityName: string,
    @Query('countryName') countryName: string,
  ): Promise<{ success: boolean; data: { longitude: number; latitude: number }; messageKey: string }> {
    if (!cityName || !countryName) {
      throw new CustomHttpException('MISSING_PARAMETERS', 'City name and country name are required', 'ERROR_MISSING_PARAMETERS', HttpStatus.BAD_REQUEST);
    }

    const result = await this.userService.resolveLongitudeAndLatitudeByCityNameAndCountryName(cityName, countryName);
    return { success: true, data: result, messageKey: 'SUCCESS_RESOLVE_LOCATION' };
  }

  @Get('resolve-location-by-ip-address')
  @UseGuards(AuthGuard)
  async resolveLocationByIpAddress(@Query('ipAddress') ipAddress: string,
  ): Promise<{ success: boolean; data: { longitude: number; latitude: number }; messageKey: string }> {
    if (!ipAddress) {
      throw new CustomHttpException('MISSING_PARAMETER', 'IP address is required', 'ERROR_MISSING_PARAMETER', HttpStatus.BAD_REQUEST);
    }

    const result = await this.userService.resolveLongitudeAndLatitudeByIPAddress(ipAddress);
    return { success: true, data: result, messageKey: 'SUCCESS_RESOLVE_LOCATION' };
  }

  // Note: This route must be defined AFTER all other GET routes
  // to prevent :username parameter from intercepting specific route names
  @Get(':username')
  @UseGuards(AuthGuard)
  async getPublicProfile(
    @CurrentUser('sub') currentUserId: string,
    @Param('username') targetUsername: string
  ): Promise<{ success: boolean, data: GetPublicProfileResponseDto, messageKey: string }> {
    // Get current user's username to compare
    const currentUser = await this.userService.findById(currentUserId);
    if (currentUser && currentUser.username === targetUsername) {
      throw new CustomHttpException('CANNOT_VIEW_OWN_PROFILE', 'Cannot view your own profile this way', 'ERROR_CANNOT_VIEW_OWN_PROFILE', HttpStatus.BAD_REQUEST);
    }
    const result: GetPublicProfileResponseDto = await this.userService.getPublicProfile(currentUserId, targetUsername);
    return { success: true, data: result, messageKey: 'SUCCESS_GET_PUBLIC_PROFILE' };
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

  @Put('me/location')
  @UseGuards(AuthGuard)
  async updateLocation(
    @CurrentUser('sub') userId: string,
    @Body() updateLocationDto: UpdateLocationRequestDto,
  ): Promise<{ success: boolean, data: UpdateLocationResponseDto, messageKey: string }> {
    const result = await this.userService.updateLocation(userId, updateLocationDto.latitude, updateLocationDto.longitude);
    return { success: true, data: result, messageKey: 'SUCCESS_LOCATION_UPDATED' };
  }

  @Post('like')
  @UseGuards(AuthGuard)
  async likeUser(@CurrentUser('sub') userId: string, @Body() likeUserRequestDto: LikeUserRequestDto) {
    await this.userService.likeUser(userId, likeUserRequestDto.userId);
    return { success: true, messageKey: 'SUCCESS_LIKE_USER' };
  }

  @Post('unlike')
  @UseGuards(AuthGuard)
  async unlikeUser(@CurrentUser('sub') userId: string, @Body() likeUserRequestDto: LikeUserRequestDto) {
    await this.userService.unLikeUser(userId, likeUserRequestDto.userId);
    return { success: true, messageKey: 'SUCCESS_UNLIKE_USER' };
  }
}
