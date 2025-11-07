import { Body, Controller, Get, Post, Put, UseGuards, HttpStatus, Query } from '@nestjs/common';
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
  UpdateLocationResponseDto
} from './dto';
import { PrivateUserDto } from './dto';
import { FindAllMatchesResponseDto } from './dto/find-all-matches/find-all-matches-response.dto';
import { LikeUserRequestDto } from './dto/like-user/like-user-request.dto';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { GetLocationListResponseDto } from './dto/get-location-list/get-location-list.dto';
import { GetUsersRequestDto } from './dto/get-users/get-users-request.dto';
import { GetUsersResponseDto } from './dto/get-users/get-users-response.dto';

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

  @Put('me/location')
  @UseGuards(AuthGuard)
  async updateLocation(
    @CurrentUser('sub') userId: string,
    @Body() updateLocationDto: UpdateLocationRequestDto,
  ): Promise<{ success: boolean, data: UpdateLocationResponseDto, messageKey: string }> {
    const result = await this.userService.updateLocation(userId, updateLocationDto.latitude, updateLocationDto.longitude);
    return { success: true, data: result, messageKey: 'SUCCESS_LOCATION_UPDATED' };
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
}
