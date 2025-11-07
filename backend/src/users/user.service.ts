import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository, User } from './repositories/users.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { InterestRepository } from 'src/interests/repository/interest.repository';
import { DatabaseService } from 'src/database/database.service';
import { LikesRepository } from './repositories/likes.repository';
import { LikeSent, LikeReceived } from './repositories/likes.repository';
import { ChatRepository } from 'src/chat/repositories/chat.repository';
import { NotificationService } from 'src/notifications/notification.service';
import { NotificationType } from 'src/common/enums/notification-type';
import { z } from 'zod';
import {
  CreateUserRequestDto,
  UpdateProfileRequestDto,
  UpdateProfileResponseDto,
  CompleteProfileRequestDto,
  CompleteProfileResponseDto,
  PublicUserDto,
  PrivateUserDto,
} from './dto';
import { FindAllMatchesResponseDto } from './dto/find-all-matches/find-all-matches-response.dto';
import { RedisRepository } from 'src/redis/repositories/redis.repository';
import { GetLocationListResponseDto, LocationEntryDto } from './dto/get-location-list/get-location-list.dto';
import { GetUsersRequestDto } from './dto/get-users/get-users-request.dto';
import { GetUsersResponseDto, UserListItemDto } from './dto/get-users/get-users-response.dto';

const IPAPIResponseSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('success'),
    lon: z.number().nullable(),
    lat: z.number().nullable(),
  }),
  z.object({
    status: z.literal('fail'),
    message: z.string(),
  }),
]);

const NominatimResponseSchema = z.object({
  address: z.object({
    city: z.string().nullable().optional(),
    town: z.string().nullable().optional(),
    village: z.string().nullable().optional(),
    municipality: z.string().nullable().optional(),
    suburb: z.string().nullable().optional(),
    county: z.string().nullable().optional(),
    state_district: z.string().nullable().optional(),
    country: z.string().nullable(),
  }),
});

const NominatimSearchResponseSchema = z.array(
  z.object({
    lat: z.string(),
    lon: z.string(),
  })
);

const ResolveLocationRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('latitudeAndLongitude'),
    latitude: z.number(),
    longitude: z.number(),
  }),
  z.object({
    type: z.literal('cityNameAndCountryName'),
    cityName: z.string(),
    countryName: z.string(),
  }),
  z.object({
    type: z.literal('ipAddress'),
    ipAddress: z.string(),
  }),
]);
type ResolveLocationRequest = z.infer<typeof ResolveLocationRequestSchema>;

type Location = {
  latitude: number;
  longitude: number;
  cityName: string;
  countryName: string;
}

const MAX_PAGE_SIZE = 10;

@Injectable()
export class UserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly interestRepository: InterestRepository,
    private readonly db: DatabaseService,
    private readonly likesRepository: LikesRepository,
    private readonly chatRepository: ChatRepository,
    private readonly notificationService: NotificationService,
    private readonly redisRepository: RedisRepository,
  ) { }

  private mapUserToPrivateUserDto(user: User): PrivateUserDto {
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      dateOfBirth: user.date_of_birth ? user.date_of_birth.toISOString() : null,
      gender: user.gender,
      biography: user.biography,
      profileCompleted: user.profile_completed,
      fameRating: user.fame_rating,
      latitude: user.latitude,
      longitude: user.longitude,
      cityName: user.city_name,
      countryName: user.country_name,
      lastTimeActive: user.last_time_active ? user.last_time_active.toISOString() : null,
      createdAt: user.created_at.toISOString(),
      email: user.email,
      username: user.username,
      isEmailVerified: user.is_email_verified,
      sexualOrientation: user.sexual_orientation,
      interests: user.interests ? user.interests : [],
      photos: user.photos ? user.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        isProfilePic: photo.is_profile_pic
      })) : [],
    };
  }

  private mapUserToPublicUserDto(user: User): PublicUserDto {
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      dateOfBirth: user.date_of_birth ? user.date_of_birth.toISOString() : null,
      gender: user.gender,
      biography: user.biography,
      fameRating: user.fame_rating,
      latitude: user.latitude,
      longitude: user.longitude,
      cityName: user.city_name,
      countryName: user.country_name,
      lastTimeActive: user.last_time_active ? user.last_time_active.toISOString() : null,
      createdAt: user.created_at.toISOString(),
      interests: user.interests ? user.interests : [],
      photos: user.photos ? user.photos.map(photo => ({
        id: photo.id,
        url: photo.url,
        isProfilePic: photo.is_profile_pic
      })) : [],
    };
  }

  private calculateAge(dateOfBirth: Date | null): number | null {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  private mapUserToUserListItemDto(user: User, liked: boolean): UserListItemDto {
    const age = this.calculateAge(user.date_of_birth);
    const profilePicture = user.photos?.find(p => p.is_profile_pic)?.url || user.photos?.[0]?.url || '';

    return {
      id: user.id,
      profilePicture,
      firstName: user.first_name,
      lastName: user.last_name,
      age: age || 0,
      fameRating: user.fame_rating,
      cityName: user.city_name || null,
      countryName: user.country_name || null,
      interests: user.interests?.map(i => ({ id: i.id, name: i.name })) || [],
      liked,
    };
  }

  async getUsers(userId: string, getUsersRequestDto: GetUsersRequestDto): Promise<GetUsersResponseDto> {
    try {
      const filters = {
        cursor: getUsersRequestDto.cursor,
        minAge: getUsersRequestDto.minAge,
        maxAge: getUsersRequestDto.maxAge,
        minFame: getUsersRequestDto.minFame,
        maxFame: getUsersRequestDto.maxFame,
        cities: getUsersRequestDto.cities,
        countries: getUsersRequestDto.countries,
        tags: getUsersRequestDto.tags,
        firstName: getUsersRequestDto.firstName,
      };

      console.log('Cursor:', getUsersRequestDto.cursor);
      const users = await this.usersRepository.getUsers(userId, filters, MAX_PAGE_SIZE + 1, getUsersRequestDto.sort);

      const likedUserIds = await this.likesRepository.findAllUsersWhoUserLiked(userId);
      const likedUserIdsSet = new Set(likedUserIds.map(like => like.to_user_id));

      const hasMore = users.length > MAX_PAGE_SIZE;
      const usersToReturn = hasMore ? users.slice(0, MAX_PAGE_SIZE) : users;

      const userListItems = usersToReturn.map(user =>
        this.mapUserToUserListItemDto(user, likedUserIdsSet.has(user.id))
      );

      // Store in the cursor the last user infos so we can use it in the next request.
      let nextCursor: string | null = null;
      if (hasMore && usersToReturn.length > 0) {
        const lastUser = usersToReturn[usersToReturn.length - 1];
        const lastTimeActive = lastUser.last_time_active
          ? lastUser.last_time_active.toISOString()
          : 'null';
        const createdAt = lastUser.created_at.toISOString();

        if (getUsersRequestDto.sort) {
          let sortValue: string;
          switch (getUsersRequestDto.sort.sortBy) {
            case 'age':
              if (!lastUser.date_of_birth) {
                sortValue = '999';
              } else {
                const birthDate = new Date(lastUser.date_of_birth);
                const today = new Date();
                const age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                const dayDiff = today.getDate() - birthDate.getDate();
                const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;
                sortValue = actualAge.toString();
              }
              break;
            case 'fameRating':
              sortValue = lastUser.fame_rating.toString();
              break;
            case 'interests':
              const commonInterestsCount = await this.usersRepository.getCommonInterestsCount(userId, lastUser.id);
              sortValue = commonInterestsCount.toString();
              break;
          }
          nextCursor = `${sortValue},${lastTimeActive},${createdAt},${lastUser.id}`;
          console.log('nextCursor:', nextCursor);
        } else {
          nextCursor = `${lastTimeActive},${createdAt},${lastUser.id}`;
        }
      }

      return {
        users: userListItems,
        nextCursor,
        hasMore,
      };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async resolveCityNameAndCountryNameByLatitudeAndLongitude(latitude: number, longitude: number): Promise<{ cityName: string, countryName: string }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1`
      );
      if (!response.ok) {
        console.error(response);
        throw new CustomHttpException(
          'FAILED_TO_RESOLVE_LOCATION',
          `Failed to resolve location for latitude: ${latitude} and longitude: ${longitude}`,
          'ERROR_FAILED_TO_RESOLVE_LOCATION',
          HttpStatus.BAD_REQUEST
        );
      }
      const data = await response.json();
      const validatedData = NominatimResponseSchema.safeParse(data);
      if (!validatedData.success || !validatedData.data.address.country) {
        console.error(validatedData);
        throw new CustomHttpException(
          'FAILED_TO_RESOLVE_LOCATION',
          `Failed to resolve location for latitude: ${latitude} and longitude: ${longitude}`,
          'ERROR_FAILED_TO_RESOLVE_LOCATION',
          HttpStatus.BAD_REQUEST
        );
      }
      const address = validatedData.data.address;
      const cityName =
        address.city ||
        address.town ||
        address.village ||
        address.municipality ||
        address.suburb;
      if (!cityName) {
        console.error('No city name found in address:', address);
        throw new CustomHttpException(
          'FAILED_TO_RESOLVE_LOCATION',
          `Failed to resolve city name for latitude: ${latitude} and longitude: ${longitude}`,
          'ERROR_FAILED_TO_RESOLVE_LOCATION',
          HttpStatus.BAD_REQUEST
        );
      }
      if (!address.country) {
        console.error('No country name found in address:', address);
        throw new CustomHttpException(
          'FAILED_TO_RESOLVE_LOCATION',
          `Failed to resolve country name for latitude: ${latitude} and longitude: ${longitude}`,
          'ERROR_FAILED_TO_RESOLVE_LOCATION',
          HttpStatus.BAD_REQUEST
        );
      }
      return { cityName, countryName: address.country };
    } catch (error) {
      console.error(error);
      if (error instanceof CustomHttpException) {
        throw error;
      }
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async resolveLongitudeAndLatitudeByCityNameAndCountryName(cityName: string, countryName: string): Promise<{ longitude: number, latitude: number }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${cityName}&country=${countryName}&format=json&limit=1`
      );
      if (!response.ok) {
        console.error(response);
        throw new CustomHttpException(
          'FAILED_TO_RESOLVE_LOCATION',
          `Failed to resolve location for city: ${cityName} and country: ${countryName}`,
          'ERROR_FAILED_TO_RESOLVE_LOCATION',
          HttpStatus.BAD_REQUEST
        );
      }
      const data = await response.json();
      const validatedData = NominatimSearchResponseSchema.safeParse(data);
      if (!validatedData.success || validatedData.data.length === 0 || !validatedData.data[0].lat || !validatedData.data[0].lon) {
        throw new CustomHttpException(
          'FAILED_TO_RESOLVE_LOCATION',
          `Failed to resolve location for city: ${cityName} and country: ${countryName}`,
          'ERROR_FAILED_TO_RESOLVE_LOCATION',
          HttpStatus.BAD_REQUEST
        );
      }
      return { longitude: parseFloat(validatedData.data[0].lon), latitude: parseFloat(validatedData.data[0].lat) };
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async resolveLongitudeAndLatitudeByIPAddress(ipAddress: string): Promise<{ longitude: number, latitude: number }> {
    try {
      const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
      if (!response.ok) {
        console.error(response);
        throw new CustomHttpException('FAILED_TO_RESOLVE_LOCATION', `Failed to resolve location for IP address: ${ipAddress}`, 'ERROR_FAILED_TO_RESOLVE_LOCATION', HttpStatus.BAD_REQUEST);
      }
      const data = await response.json();
      const validatedData = IPAPIResponseSchema.safeParse(data);
      if (!validatedData.success) {
        console.error('Failed to parse IP-API response:', validatedData.error);
        throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      if (validatedData.data.status === 'fail') {
        console.log(`Failed to resolve location for IP address: ${validatedData.data.message || 'Unknown error'}`);
        throw new CustomHttpException('FAILED_TO_RESOLVE_LOCATION', `Failed to resolve location for IP address: ${validatedData.data.message || 'Unknown error'}`, 'ERROR_FAILED_TO_RESOLVE_LOCATION', HttpStatus.BAD_REQUEST);
      }
      if (!validatedData.data.lon || !validatedData.data.lat) {
        console.log('IP-API returned a response with no longitude or latitude');
        throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return { longitude: validatedData.data.lon, latitude: validatedData.data.lat };
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async findPublicProfileById(id: string): Promise<PublicUserDto | null> {
    const user: User | null = await this.usersRepository.findById(id);
    if (!user) return null;
    return this.mapUserToPublicUserDto(user);
  }

  async findByUsername(username: string): Promise<PrivateUserDto | null> {
    const user: User | null = await this.usersRepository.findByUsername(username);
    if (!user) return null;
    return this.mapUserToPrivateUserDto(user);
  }

  async findByEmailOrUsername(email: string, username: string): Promise<PrivateUserDto | null> {
    const user: User | null = await this.usersRepository.findByEmailOrUsername(email, username);
    if (!user) return null;
    return this.mapUserToPrivateUserDto(user);
  }

  async findById(id: string): Promise<PrivateUserDto | null> {
    const user: User | null = await this.usersRepository.findById(id);
    if (!user) return null;
    return this.mapUserToPrivateUserDto(user);
  }

  async findByEmail(email: string): Promise<PrivateUserDto | null> {
    const user: User | null = await this.usersRepository.findByEmail(email);
    if (!user) return null;
    return this.mapUserToPrivateUserDto(user);
  }

  async create(createUserDto: CreateUserRequestDto): Promise<PrivateUserDto> {
    const existingUser = await this.findByEmailOrUsername(
      createUserDto.email,
      createUserDto.username,
    );
    if (existingUser) throw new CustomHttpException('USERNAME_OR_EMAIL_ALREADY_EXISTS', 'Username or email already exists.', 'ERROR_USERNAME_OR_EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const user: User = await this.usersRepository.create({ ...createUserDto, password: passwordHash });
    return this.mapUserToPrivateUserDto(user);
  }

  async validatePassword(username: string, password: string): Promise<boolean> {
    const passwordHash = await this.usersRepository.getPasswordHashByUsername(username);
    if (!passwordHash) return false;
    return bcrypt.compare(password, passwordHash);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.updatePassword(userId, hash);
  }

  async updateEmailVerified(userId: string, isEmailVerified: boolean): Promise<void> {
    await this.usersRepository.updateEmailVerified(userId, isEmailVerified);
  }

  private async resolveLocation(request: ResolveLocationRequest): Promise<Location> {
    let resolvedLocation: Location;
    switch (request.type) {
      case 'latitudeAndLongitude': {
        const resolved: { cityName: string, countryName: string } = await this.resolveCityNameAndCountryNameByLatitudeAndLongitude(request.latitude, request.longitude);
        resolvedLocation = {
          latitude: request.latitude,
          longitude: request.longitude,
          cityName: resolved.cityName,
          countryName: resolved.countryName,
        };
        break;
      }
      case 'cityNameAndCountryName': {
        const resolved: { longitude: number, latitude: number } = await this.resolveLongitudeAndLatitudeByCityNameAndCountryName(request.cityName, request.countryName);
        resolvedLocation = {
          latitude: resolved.latitude,
          longitude: resolved.longitude,
          cityName: request.cityName,
          countryName: request.countryName,
        };
        break;
      }
      case 'ipAddress': {
        const resolvedLatitudeAndLongitude: { longitude: number, latitude: number } = await this.resolveLongitudeAndLatitudeByIPAddress(request.ipAddress);
        const resolvedCityNameAndCountryName: { cityName: string, countryName: string } = await this.resolveCityNameAndCountryNameByLatitudeAndLongitude(resolvedLatitudeAndLongitude.latitude, resolvedLatitudeAndLongitude.longitude);
        resolvedLocation = {
          latitude: resolvedLatitudeAndLongitude.latitude,
          longitude: resolvedLatitudeAndLongitude.longitude,
          cityName: resolvedCityNameAndCountryName.cityName,
          countryName: resolvedCityNameAndCountryName.countryName,
        };
        break;
      }
      default:
        throw new CustomHttpException('INVALID_LOCATION_TYPE', 'Invalid location type', 'ERROR_INVALID_LOCATION_TYPE', HttpStatus.BAD_REQUEST);
    }
    return resolvedLocation;
  }

  private async incrementLocationList(cityName: string, countryName: string): Promise<void> {
    try {
      await this.redisRepository.incrementEntry(`location:${cityName}, ${countryName}`);
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async decrementLocationList(cityName: string, countryName: string): Promise<void> {
    try {
      await this.redisRepository.decrementEntry(`location:${cityName}, ${countryName}`);
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async completeProfile(userId: string, dto: CompleteProfileRequestDto, ipAddress?: string): Promise<CompleteProfileResponseDto> {
    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) { throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND); }
    if (existingUser.profile_completed) { throw new CustomHttpException('PROFILE_ALREADY_COMPLETED', 'Profile already completed', 'ERROR_PROFILE_ALREADY_COMPLETED', HttpStatus.BAD_REQUEST); }
    let location: Location;
    if (dto.latitude && dto.longitude) {
      location = await this.resolveLocation({ type: 'latitudeAndLongitude', latitude: dto.latitude, longitude: dto.longitude });
    } else if (ipAddress) {
      location = await this.resolveLocation({ type: 'ipAddress', ipAddress: ipAddress });
    } else {
      throw new CustomHttpException('MISSING_LOCATION_INFORMATION', 'Missing location information', 'ERROR_MISSING_LOCATION_INFORMATION', HttpStatus.BAD_REQUEST);
    }
    const user = await this.db.transaction(async (client) => {
      await this.interestRepository.updateUserInterests(userId, dto.interestIds, client);
      const user = await this.usersRepository.completeProfile(
        userId,
        {
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          sexualOrientation: dto.sexualOrientation,
          biography: dto.biography,
          location: location,
        },
        client
      );
      try {
        await this.incrementLocationList(location.cityName, location.countryName);
      } catch (error) {
        console.error('Failed to increment location counter in Redis:', error);
        throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return user;
    });
    return { user: this.mapUserToPrivateUserDto(user) };
  }

  async updateProfile(userId: string, dto: UpdateProfileRequestDto): Promise<UpdateProfileResponseDto> {
    const user: User = await this.usersRepository.updateProfile(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      gender: dto.gender,
      sexualOrientation: dto.sexualOrientation,
      biography: dto.biography,
    });
    return { user: this.mapUserToPrivateUserDto(user) };
  }

  async findAllMatches(userId: string): Promise<FindAllMatchesResponseDto> {
    const usersWhoUserLiked: LikeSent[] = await this.likesRepository.findAllUsersWhoUserLiked(userId);
    const usersWhoLikedUser: LikeReceived[] = await this.likesRepository.findAllUsersWhoLikedUserId(userId);
    const usersWhoLikedUserSet: Set<string> = new Set(usersWhoLikedUser.map(like => like.from_user_id));
    const matches: string[] = usersWhoUserLiked.filter(like => usersWhoLikedUserSet.has(like.to_user_id)).map(like => like.to_user_id);
    const matchesPublic: PublicUserDto[] = [];
    for (const match of matches) {
      const user = await this.findPublicProfileById(match);
      if (user) {
        matchesPublic.push(user);
      }
    }
    return { users: matchesPublic };
  }

  async hasUserLikedUser(fromUserId: string, toUserId: string): Promise<boolean> {
    const like = await this.likesRepository.findByFromUserIdAndToUserId(fromUserId, toUserId);
    return like !== null;
  }

  async likeUser(fromUserId: string, toUserId: string): Promise<void> {
    if (fromUserId === toUserId) {
      throw new CustomHttpException('SELF_LIKE_NOT_ALLOWED', 'You cannot like yourself.', 'ERROR_SELF_LIKE_NOT_ALLOWED', HttpStatus.BAD_REQUEST);
    }
    const like = await this.likesRepository.create(fromUserId, toUserId);
    if (!like) {
      throw new CustomHttpException('ALREADY_LIKED_USER', 'You have already liked this user.', 'ERROR_ALREADY_LIKED_USER', HttpStatus.CONFLICT);
    }
    const hasUserLikedUser = await this.hasUserLikedUser(toUserId, fromUserId);
    // Match found => Create chat and send notification to both users
    if (hasUserLikedUser) {
      await this.chatRepository.createChat(fromUserId, toUserId);
      await this.notificationService.createNotification({ userId: fromUserId, type: NotificationType.MATCH, sourceUserId: toUserId });
      await this.notificationService.createNotification({ userId: toUserId, type: NotificationType.MATCH, sourceUserId: fromUserId });
    } else { // Like notification
      await this.notificationService.createNotification({ userId: toUserId, type: NotificationType.LIKE, sourceUserId: fromUserId });
    }
  }

  async unLikeUser(fromUserId: string, toUserId: string): Promise<void> {
    await this.likesRepository.unLikeUser(fromUserId, toUserId);
    await this.notificationService.createNotification({ userId: toUserId, type: NotificationType.UNLIKE, sourceUserId: fromUserId });
  }

  async getCityNameByUserId(userId: string): Promise<string> {
    return await this.usersRepository.getCityNameByUserId(userId);
  }

  async getCountryNameByUserId(userId: string): Promise<string> {
    return await this.usersRepository.getCountryNameByUserId(userId);
  }

  async getLocationList(userId: string): Promise<GetLocationListResponseDto> {
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }
    if (!user.city_name || !user.country_name) {
      throw new CustomHttpException('USER_LOCATION_NOT_SET', 'User location not set', 'ERROR_USER_LOCATION_NOT_SET', HttpStatus.BAD_REQUEST);
    }
    const locationKeys: string[] = await this.redisRepository.getEntries(`location:*`);
    if (locationKeys.length === 0) {
      return { locations: [] };
    }
    const countValues: (string | null)[] = await this.redisRepository.getEntriesBatch(locationKeys);
    const locationEntries: LocationEntryDto[] = [];
    for (let i = 0; i < locationKeys.length; i++) {
      const key = locationKeys[i];
      const locationString = key.replace('location:', '');
      const [cityName, countryName] = locationString.split(', ');
      const countValue = countValues[i];
      const count = countValue ? parseInt(countValue, 10) : 0;
      if (cityName === user.city_name && countryName === user.country_name) {
        if (count - 1 <= 0) {
          continue;
        } else {
          locationEntries.push({ cityName, countryName, count: count - 1 });
        }
      } else {
        locationEntries.push({ cityName, countryName, count });
      }
    }
    return { locations: locationEntries };
  }
}
