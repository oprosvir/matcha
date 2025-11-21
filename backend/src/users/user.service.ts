import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository, User } from './repositories/users.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { InterestRepository } from 'src/interests/repository/interest.repository';
import { DatabaseService } from 'src/database/database.service';
import { LikesRepository } from './repositories/likes.repository';
import { LikeSent, LikeReceived } from './repositories/likes.repository';
import { BlocksRepository } from './repositories/blocks.repository';
import { ReportsRepository } from './repositories/reports.repository';
import { PhotosRepository } from './repositories/photos.repository';
import { ChatRepository } from 'src/chat/repositories/chat.repository';
import { NotificationService } from 'src/notifications/notification.service';
import { NotificationType } from 'src/common/enums/notification-type';
import { ReportReason } from 'src/common/enums/report-reason.enum';
import { z } from 'zod';
import {
  CreateUserRequestDto,
  UpdateProfileRequestDto,
  UpdateProfileResponseDto,
  CompleteProfileRequestDto,
  CompleteProfileResponseDto,
  PublicUserDto,
  PrivateUserDto,
  GetLocationListResponseDto,
  LocationEntryDto,
  GetPublicProfileResponseDto,
} from './dto';
import { FindAllMatchesResponseDto } from './dto/find-all-matches/response.dto';
import { FindAllLikesResponseDto } from './dto/find-all-likes/response.dto';
import { FindAllLikesSentResponseDto } from './dto/find-all-likes-sent/response.dto';
import { RedisRepository } from 'src/redis/repositories/redis.repository';
import { GetUsersRequestDto } from './dto/get-users/request.dto';
import { GetUsersResponseDto, UserListItemDto } from './dto/get-users/response.dto';
import { GetSuggestedUsersRequestDto } from './dto/get-suggested-users/request.dto';
import { Gender, SexualOrientation } from './enums/user.enums';

// Zod schemas for external API validation
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
const SUGGESTED_USERS_LIMIT = 50;

@Injectable()
export class UserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly interestRepository: InterestRepository,
    private readonly db: DatabaseService,
    private readonly likesRepository: LikesRepository,
    private readonly blocksRepository: BlocksRepository,
    private readonly reportsRepository: ReportsRepository,
    private readonly photosRepository: PhotosRepository,
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
      latitude: Number(user.latitude),
      longitude: Number(user.longitude),
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
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      dateOfBirth: user.date_of_birth ? user.date_of_birth.toISOString() : null,
      gender: user.gender,
      sexualOrientation: user.sexual_orientation,
      biography: user.biography,
      fameRating: user.fame_rating,
      latitude: Number(user.latitude),
      longitude: Number(user.longitude),
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

  private mapUserToUserListItemDto(user: User, distance?: number): UserListItemDto {
    const age = this.calculateAge(user.date_of_birth);
    const profilePicture = user.photos?.find(p => p.is_profile_pic)?.url || user.photos?.[0]?.url || '';

    return {
      id: user.id,
      username: user.username,
      profilePicture,
      firstName: user.first_name,
      lastName: user.last_name,
      age: age || 0,
      fameRating: user.fame_rating,
      cityName: user.city_name || null,
      countryName: user.country_name || null,
      interests: user.interests?.map(i => ({ id: i.id, name: i.name })) || [],
      distance,
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

      const users = await this.usersRepository.getUsers(userId, filters, MAX_PAGE_SIZE + 1, getUsersRequestDto.sort);

      const hasMore = users.length > MAX_PAGE_SIZE;
      const usersToReturn = hasMore ? users.slice(0, MAX_PAGE_SIZE) : users;

      const userListItems = usersToReturn.map(user =>
        this.mapUserToUserListItemDto(user)
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
            case 'distance':
              const currentUser = await this.usersRepository.findById(userId);
              if (!currentUser || !currentUser.latitude || !currentUser.longitude || !lastUser.latitude || !lastUser.longitude) {
                sortValue = '999999'; // Large distance for users without coordinates
              } else {
                const distance = this.getDistance(currentUser.latitude, currentUser.longitude, lastUser.latitude, lastUser.longitude);
                sortValue = distance.toFixed(2);
              }
              break;
          }
          nextCursor = `${sortValue},${lastTimeActive},${createdAt},${lastUser.id}`;
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
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private sharedTagsCount(tags1: string[], tags2: string[]): number {
    return tags1.filter(tag => tags2.includes(tag)).length;
  }

  private computeScore(user: User, currentUser: PrivateUserDto): number {
    if (!user.latitude || !user.longitude || !currentUser.latitude || !currentUser.longitude || !user.interests || !currentUser.interests) {
      return 0;
    }
    const distance = this.getDistance(user.latitude, user.longitude, currentUser.latitude, currentUser.longitude);
    const sharedTagsCount = this.sharedTagsCount(user.interests.map(i => i.id), currentUser.interests.map(i => i.id));
    const fameRating = user.fame_rating;

    const distanceScore = 1 / (1 + distance / 100);
    const tagsScore = Math.min(sharedTagsCount / 10, 1);
    const fameScore = fameRating / 100;

    return distanceScore * 0.6 + tagsScore * 0.25 + fameScore * 0.15;
  }

  private isSexualOrientationCompatible(
    currentUserGender: Gender | null,
    currentUserOrientation: SexualOrientation | null,
    otherUserGender: Gender | null,
    otherUserOrientation: SexualOrientation | null
  ): boolean {
    if (!currentUserGender || !currentUserOrientation || !otherUserGender || !otherUserOrientation) {
      return true;
    }

    const currentUserCanSeeOther = this.canUserSeeGender(
      currentUserOrientation,
      currentUserGender,
      otherUserGender
    );

    const otherUserCanSeeCurrent = this.canUserSeeGender(
      otherUserOrientation,
      otherUserGender,
      currentUserGender
    );

    return currentUserCanSeeOther && otherUserCanSeeCurrent;
  }

  private canUserSeeGender(
    userOrientation: SexualOrientation,
    userGender: Gender,
    targetGender: Gender
  ): boolean {
    if (userOrientation === SexualOrientation.BISEXUAL) {
      return true;
    }

    if (userOrientation === SexualOrientation.STRAIGHT) {
      return userGender !== targetGender;
    }

    if (userOrientation === SexualOrientation.GAY) {
      return userGender === targetGender;
    }

    return true;
  }

  private getTopMatches(users: User[], currentUser: PrivateUserDto, limit = 50): User[] {
    return users
      .filter(u => u.id !== currentUser.id)
      .map(u => ({ user: u, score: this.computeScore(u, currentUser) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.user);
  }

  async getSuggestedUsers(userId: string, getSuggestedUsersRequestDto: GetSuggestedUsersRequestDto): Promise<GetUsersResponseDto> {
    try {
      // Get current user's location
      const currentUser = await this.findById(userId);
      if (!currentUser) {
        throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      if (!currentUser.latitude || !currentUser.longitude) {
        throw new CustomHttpException('LOCATION_REQUIRED', 'User location is required for suggestions', 'ERROR_LOCATION_REQUIRED', HttpStatus.BAD_REQUEST);
      }

      const likedUsers = await this.likesRepository.findAllUsersWhoUserLiked(userId);
      const likedUserIds = new Set(likedUsers.map(like => like.to_user_id));

      // Get all blocked users (both who I blocked and who blocked me)
      const blockedUsers = await this.blocksRepository.getAllBlockedUserIds(userId);
      const blockedUserIds = new Set(blockedUsers);

      const filters = {
        minAge: getSuggestedUsersRequestDto.minAge,
        maxAge: getSuggestedUsersRequestDto.maxAge,
        minFame: getSuggestedUsersRequestDto.minFame,
        maxFame: getSuggestedUsersRequestDto.maxFame,
        cities: getSuggestedUsersRequestDto.cities,
        countries: getSuggestedUsersRequestDto.countries,
        tags: getSuggestedUsersRequestDto.tags,
        firstName: getSuggestedUsersRequestDto.firstName,
      };

      // We can do that locally because we have a small number of users (500) so it's fine.
      const users = await this.usersRepository.getAllUsers();
      const topMatches = this.getTopMatches(users, currentUser, SUGGESTED_USERS_LIMIT * 2); // Get more to account for filtering

      const filteredTopMatches = topMatches.filter(u => {
        // Exclude already liked users
        if (likedUserIds.has(u.id)) {
          return false;
        }

        // Exclude blocked users (both ways)
        if (blockedUserIds.has(u.id)) {
          return false;
        }

        // Filter by sexual orientation compatibility
        if (!this.isSexualOrientationCompatible(
          currentUser.gender,
          currentUser.sexualOrientation,
          u.gender,
          u.sexual_orientation
        )) {
          return false;
        }

        if (filters.cities && filters.cities.length > 0) {
          if (!u.city_name || !filters.cities.includes(u.city_name)) {
            return false;
          }
        }

        if (filters.countries && filters.countries.length > 0) {
          if (!u.country_name || !filters.countries.includes(u.country_name)) {
            return false;
          }
        }

        if (filters.tags && filters.tags.length > 0) {
          if (!u.interests || !u.interests.some(interest => filters.tags!.includes(interest.name))) {
            return false;
          }
        }

        if (filters.minFame !== undefined && u.fame_rating < filters.minFame) {
          return false;
        }
        if (filters.maxFame !== undefined && u.fame_rating > filters.maxFame) {
          return false;
        }

        if (filters.minAge !== undefined || filters.maxAge !== undefined) {
          const age = this.calculateAge(u.date_of_birth);
          if (age === null) {
            return false;
          }
          if (filters.minAge !== undefined && age < filters.minAge) {
            return false;
          }
          if (filters.maxAge !== undefined && age > filters.maxAge) {
            return false;
          }
        }

        if (filters.firstName && filters.firstName.trim().length > 0) {
          if (!u.first_name || !u.first_name.toLowerCase().includes(filters.firstName.toLowerCase().trim())) {
            return false;
          }
        }

        return true;
      }).slice(0, SUGGESTED_USERS_LIMIT); // Limit to SUGGESTED_USERS_LIMIT after all filtering

      const userListItems = filteredTopMatches.map(user => {
        // Calculate distance for sorting purposes
        let distance: number | undefined;
        if (user.latitude && user.longitude && currentUser.latitude && currentUser.longitude) {
          distance = this.getDistance(currentUser.latitude, currentUser.longitude, user.latitude, user.longitude);
        }
        return this.mapUserToUserListItemDto(user, distance);
      });
      return {
        users: userListItems,
        nextCursor: null,
        hasMore: filteredTopMatches.length > SUGGESTED_USERS_LIMIT,
      };
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async resolveCityNameAndCountryNameByLatitudeAndLongitude(latitude: number, longitude: number): Promise<{ cityName: string, countryName: string }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2&addressdetails=1&accept-language=en`
      );
      if (!response.ok) {
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
        throw new CustomHttpException(
          'FAILED_TO_RESOLVE_LOCATION',
          `Failed to resolve city name for latitude: ${latitude} and longitude: ${longitude}`,
          'ERROR_FAILED_TO_RESOLVE_LOCATION',
          HttpStatus.BAD_REQUEST
        );
      }
      if (!address.country) {
        throw new CustomHttpException(
          'FAILED_TO_RESOLVE_LOCATION',
          `Failed to resolve country name for latitude: ${latitude} and longitude: ${longitude}`,
          'ERROR_FAILED_TO_RESOLVE_LOCATION',
          HttpStatus.BAD_REQUEST
        );
      }
      return { cityName, countryName: address.country };
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async resolveLongitudeAndLatitudeByCityNameAndCountryName(cityName: string, countryName: string): Promise<{ longitude: number, latitude: number }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${cityName}&country=${countryName}&format=json&limit=1&accept-language=en`
      );
      if (!response.ok) {
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
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async resolveLongitudeAndLatitudeByIPAddress(ipAddress: string): Promise<{ longitude: number, latitude: number }> {
    try {
      const response = await fetch(`http://ip-api.com/json/${ipAddress}`);
      if (!response.ok) {
        throw new CustomHttpException('FAILED_TO_RESOLVE_LOCATION', `Failed to resolve location for IP address: ${ipAddress}`, 'ERROR_FAILED_TO_RESOLVE_LOCATION', HttpStatus.BAD_REQUEST);
      }
      const data = await response.json();
      const validatedData = IPAPIResponseSchema.safeParse(data);
      if (!validatedData.success) {
        throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      if (validatedData.data.status === 'fail') {
        throw new CustomHttpException('FAILED_TO_RESOLVE_LOCATION', `Failed to resolve location for IP address: ${validatedData.data.message || 'Unknown error'}`, 'ERROR_FAILED_TO_RESOLVE_LOCATION', HttpStatus.BAD_REQUEST);
      }
      if (!validatedData.data.lon || !validatedData.data.lat) {
        throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      return { longitude: validatedData.data.lon, latitude: validatedData.data.lat };
    } catch (error) {
      throw error;
    }
  }

  async findPublicProfileById(id: string): Promise<PublicUserDto | null> {
    const user: User | null = await this.usersRepository.findById(id);
    if (!user) return null;
    return this.mapUserToPublicUserDto(user);
  }

  async findPublicProfileByUsername(username: string): Promise<PublicUserDto | null> {
    const user: User | null = await this.usersRepository.findByUsername(username);
    if (!user) return null;
    return this.mapUserToPublicUserDto(user);
  }

  /* Get another user's public profile with connection status and online status */
  async getPublicProfile(currentUserId: string, targetUsername: string): Promise<GetPublicProfileResponseDto> {
    const targetUser = await this.findPublicProfileByUsername(targetUsername);
    if (!targetUser) {
      throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const targetUserId = targetUser.id;

    // Prevent viewing own profile
    if (currentUserId === targetUserId) {
      throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // Check if target user blocked current user - if yes, hide profile
    const theyBlockedYou = await this.blocksRepository.hasUserBlockedUser(targetUserId, currentUserId);
    if (theyBlockedYou) {
      throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    // Check connection status
    const youLikedThem = await this.hasUserLikedUser(currentUserId, targetUserId);
    const theyLikedYou = await this.hasUserLikedUser(targetUserId, currentUserId);
    const isConnected = youLikedThem && theyLikedYou;

    // Check if current user blocked target user (one-way check for UI)
    const youBlockedThem = await this.blocksRepository.hasUserBlockedUser(currentUserId, targetUserId);

    // Check online status (online if active in last 5 minutes)
    const isOnline = targetUser.lastTimeActive
      ? new Date().getTime() - new Date(targetUser.lastTimeActive).getTime() < 5 * 60 * 1000
      : false;

    return {
      user: targetUser,
      connectionStatus: {
        youLikedThem,
        theyLikedYou,
        isConnected,
        youBlockedThem,
      },
      isOnline,
    };
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
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async decrementLocationList(cityName: string, countryName: string): Promise<void> {
    try {
      await this.redisRepository.decrementEntry(`location:${cityName}, ${countryName}`);
    } catch (error) {
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateLocation(userId: string, latitude: number, longitude: number): Promise<{ user: PrivateUserDto }> {
    const oldUser = await this.usersRepository.findById(userId);
    if (!oldUser) {
      throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    if (oldUser.city_name && oldUser.country_name) {
      try {
        await this.decrementLocationList(oldUser.city_name, oldUser.country_name);
      } catch (error) {
        // Silently fail - location counter update is not critical
      }
    }

    const location = await this.resolveLocation({
      type: 'latitudeAndLongitude',
      latitude,
      longitude
    });

    const updatedUser = await this.usersRepository.updateLocation(userId, location);

    try {
      await this.incrementLocationList(location.cityName, location.countryName);
    } catch (error) {
      // Silently fail - location counter update is not critical
    }

    return { user: this.mapUserToPrivateUserDto(updatedUser) };
  }

  async completeProfile(userId: string, dto: CompleteProfileRequestDto): Promise<CompleteProfileResponseDto> {
    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) { throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND); }
    if (existingUser.profile_completed) { throw new CustomHttpException('PROFILE_ALREADY_COMPLETED', 'Profile already completed', 'ERROR_PROFILE_ALREADY_COMPLETED', HttpStatus.BAD_REQUEST); }

    // Validate that user has at least one photo uploaded
    const photoCount = await this.photosRepository.getUserPhotoCount(userId);
    if (photoCount === 0) {
      throw new CustomHttpException(
        'NO_PHOTOS_UPLOADED',
        'You must upload at least one photo before completing your profile',
        'ERROR_NO_PHOTOS',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate that user has a profile picture set
    const photos = await this.photosRepository.getUserPhotos(userId);
    const hasProfilePicture = photos.some(photo => photo.is_profile_pic);
    if (!hasProfilePicture) {
      throw new CustomHttpException(
        'NO_PROFILE_PICTURE',
        'You must select a profile picture',
        'ERROR_NO_PROFILE_PICTURE',
        HttpStatus.BAD_REQUEST,
      );
    }

    const location = await this.resolveLocation({
      type: 'latitudeAndLongitude',
      latitude: dto.latitude,
      longitude: dto.longitude,
    });

    if (existingUser.city_name && existingUser.country_name) {
      await this.decrementLocationList(existingUser.city_name, existingUser.country_name);
    }

    // Update interests, complete profile, and update location in a transaction
    const user = await this.db.transaction(async (client) => {
      await this.interestRepository.updateUserInterests(userId, dto.interestIds, client);

      await this.usersRepository.completeProfile(
        userId,
        {
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          sexualOrientation: dto.sexualOrientation,
          biography: dto.biography,
        }
      );

      const user = await this.usersRepository.updateLocation(
        userId,
        {
          latitude: dto.latitude,
          longitude: dto.longitude,
          cityName: location.cityName,
          countryName: location.countryName,
        },
        client
      );

      return user;
    });

    try {
      await this.incrementLocationList(location.cityName, location.countryName);
    } catch (error) {
      // Silently fail - location counter update is not critical
    }

    try {
      await this.usersRepository.updateFameRating(userId);
    } catch (error) {
      // Silently fail - fame rating update is not critical
    }

    return { user: this.mapUserToPrivateUserDto(user) };
  }

  async updateProfile(userId: string, dto: UpdateProfileRequestDto): Promise<UpdateProfileResponseDto> {
    let emailChanged = false;

    if (dto.email) {
      const currentUser = await this.usersRepository.findById(userId);
      if (!currentUser) {
        throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      if (dto.email !== currentUser.email) {
        const existingUser = await this.usersRepository.findByEmail(dto.email);
        if (existingUser && existingUser.id !== userId) {
          throw new CustomHttpException('EMAIL_ALREADY_EXISTS', 'Email is already in use by another account', 'ERROR_EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
        }
        emailChanged = true;
      }
    }

    const user: User = await this.usersRepository.updateProfile(userId, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      gender: dto.gender,
      sexualOrientation: dto.sexualOrientation,
      biography: dto.biography,
      email: dto.email,
      isEmailVerified: emailChanged ? false : undefined,
    });

    return {
      user: this.mapUserToPrivateUserDto(user),
      emailChanged,
    };
  }

  async findAllMatches(userId: string): Promise<FindAllMatchesResponseDto> {
    const usersWhoUserLiked: LikeSent[] = await this.likesRepository.findAllUsersWhoUserLiked(userId);
    const usersWhoLikedUser: LikeReceived[] = await this.likesRepository.findAllUsersWhoLikedUserId(userId);

    // Create maps for timestamps
    const usersWhoLikedUserMap = new Map(usersWhoLikedUser.map(like => [like.from_user_id, like.created_at]));
    const usersWhoUserLikedMap = new Map(usersWhoUserLiked.map(like => [like.to_user_id, like.created_at]));

    // Find matches and calculate match timestamp (max of the two like timestamps)
    const matchesWithTimestamp: { userId: string; matchedAt: Date }[] = usersWhoUserLiked
      .filter(like => usersWhoLikedUserMap.has(like.to_user_id))
      .map(like => {
        const sentAt = like.created_at;
        const receivedAt = usersWhoLikedUserMap.get(like.to_user_id)!;
        // Match happened when the second like was created (the later one)
        const matchedAt = sentAt > receivedAt ? sentAt : receivedAt;
        return { userId: like.to_user_id, matchedAt };
      });

    // Sort by match timestamp (most recent first)
    matchesWithTimestamp.sort((a, b) => b.matchedAt.getTime() - a.matchedAt.getTime());

    // Fetch user profiles in sorted order
    const matchesPublic: PublicUserDto[] = [];
    for (const match of matchesWithTimestamp) {
      const user = await this.findPublicProfileById(match.userId);
      if (user) {
        matchesPublic.push(user);
      }
    }
    return { users: matchesPublic };
  }

  /* Find all users who liked the given user, excluding blocked users */
  async findAllLikes(userId: string): Promise<FindAllLikesResponseDto> {
    const likesReceived: LikeReceived[] = await this.likesRepository.findAllUsersWhoLikedUserId(userId);

    const blockedUserIds = await this.blocksRepository.getAllBlockedUserIds(userId);
    const blockedSet = new Set(blockedUserIds);

    const filteredLikes = likesReceived.filter(like => !blockedSet.has(like.from_user_id));

    const userIds = filteredLikes.map(like => like.from_user_id);
    const users = await this.usersRepository.findAllPreviewByIds(userIds);

    const usersMap = new Map(users.map(user => [user.id, user]));

    return {
      likes: filteredLikes.map(like => {
        const liker = usersMap.get(like.from_user_id);
        return {
          id: like.from_user_id,
          likedAt: like.created_at.toISOString(),
          liker: {
            id: liker.id,
            username: liker.username,
            firstName: liker.firstName,
            lastName: liker.lastName,
            profilePicture: liker.profilePicture,
          }
        };
      })
    };
  }

  /* Find all users whom the given user has liked, excluding blocked users */
  async findAllLikesSent(userId: string): Promise<FindAllLikesSentResponseDto> {
    const likesSent: LikeSent[] = await this.likesRepository.findAllUsersWhoUserLiked(userId);

    const blockedUserIds = await this.blocksRepository.getAllBlockedUserIds(userId);
    const blockedSet = new Set(blockedUserIds);

    const filteredLikes = likesSent.filter(like => !blockedSet.has(like.to_user_id));

    const userIds = filteredLikes.map(like => like.to_user_id);
    const users = await this.usersRepository.findAllPreviewByIds(userIds);

    const usersMap = new Map(users.map(user => [user.id, user]));

    return {
      likes: filteredLikes.map(like => {
        const liked = usersMap.get(like.to_user_id);
        return {
          id: like.to_user_id,
          likedAt: like.created_at.toISOString(),
          liked: {
            id: liked.id,
            username: liked.username,
            firstName: liked.firstName,
            lastName: liked.lastName,
            profilePicture: liked.profilePicture,
          }
        };
      })
    };
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
      const existingChat = await this.chatRepository.findChatByUserIds(fromUserId, toUserId);
      if (!existingChat) {
        await this.chatRepository.createChat(fromUserId, toUserId);
        await this.notificationService.createNotification({ userId: fromUserId, type: NotificationType.MATCH, sourceUserId: toUserId });
        await this.notificationService.createNotification({ userId: toUserId, type: NotificationType.MATCH, sourceUserId: fromUserId });
      }
      // Update fame rating for both users (they both got a match)
      try {
        await Promise.all([
          this.usersRepository.updateFameRating(fromUserId),
          this.usersRepository.updateFameRating(toUserId),
        ]);
      } catch (error) {
        // Silently fail - fame rating update is not critical
      }
    } else { // Like notification
      await this.notificationService.createNotification({ userId: toUserId, type: NotificationType.LIKE, sourceUserId: fromUserId });
      // Update fame rating for the user who received the like
      try {
        await this.usersRepository.updateFameRating(toUserId);
      } catch (error) {
        // Silently fail - fame rating update is not critical
      }
    }
  }

  async unLikeUser(fromUserId: string, toUserId: string): Promise<void> {
    if (fromUserId === toUserId) {
      throw new CustomHttpException('SELF_UNLIKE_NOT_ALLOWED', 'You cannot unlike yourself.', 'ERROR_SELF_UNLIKE_NOT_ALLOWED', HttpStatus.BAD_REQUEST);
    }
    const like = await this.likesRepository.findByFromUserIdAndToUserId(fromUserId, toUserId);
    if (!like) {
      throw new CustomHttpException('NOT_LIKED_USER', 'You have not liked this user.', 'ERROR_NOT_LIKED_USER', HttpStatus.BAD_REQUEST);
    }
    await this.likesRepository.unLikeUser(fromUserId, toUserId);
    await this.notificationService.createNotification({ userId: toUserId, type: NotificationType.UNLIKE, sourceUserId: fromUserId });

    // Update fame rating for the user who lost the like
    try {
      await this.usersRepository.updateFameRating(toUserId);
    } catch (error) {
      // Silently fail - fame rating update is not critical
    }
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

  /* Block user flow:
    1. Check if blockerId === blockedId => error
    2. Check if blocked user exists => error if not
    3. Check if they were matched (mutual like) - before transaction
    4. Start transaction
      a. Unlike both sides if they liked each other
      b. Block the user
    5. Commit transaction
    6. Send unlike notification AFTER transaction if they were matched
    7. Note: We don't delete the chat - it will just be filtered out from conversations list
  */
  async blockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new CustomHttpException('SELF_BLOCK_NOT_ALLOWED', 'You cannot block yourself.', 'ERROR_SELF_BLOCK_NOT_ALLOWED', HttpStatus.BAD_REQUEST);
    }

    const blockedUser = await this.usersRepository.findById(blockedId);
    if (!blockedUser) {
      throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    const blockerLikedBlocked = await this.likesRepository.findByFromUserIdAndToUserId(blockerId, blockedId);
    const blockedLikedBlocker = await this.likesRepository.findByFromUserIdAndToUserId(blockedId, blockerId);
    const wereMatched = blockerLikedBlocked && blockedLikedBlocker;

    const client = await this.db.getClient();
    try {
      await client.query('BEGIN');

      if (blockerLikedBlocked) {
        await this.likesRepository.unLikeUser(blockerId, blockedId);
        await this.usersRepository.updateFameRating(blockedId);
      }
      if (blockedLikedBlocker) {
        await this.likesRepository.unLikeUser(blockedId, blockerId);
        await this.usersRepository.updateFameRating(blockerId);
      }

      await this.blocksRepository.blockUser(blockerId, blockedId);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    if (wereMatched) {
      try {
        await this.notificationService.createNotification({
          userId: blockedId,
          type: NotificationType.UNLIKE,
          sourceUserId: blockerId
        });
      } catch (error) {
        // Silently fail - notification is not critical
      }
    }
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    if (blockerId === blockedId) {
      throw new CustomHttpException('SELF_UNBLOCK_NOT_ALLOWED', 'You cannot unblock yourself.', 'ERROR_SELF_UNBLOCK_NOT_ALLOWED', HttpStatus.BAD_REQUEST);
    }

    const isBlocked = await this.blocksRepository.isBlocked(blockerId, blockedId);
    if (!isBlocked) {
      throw new CustomHttpException('USER_NOT_BLOCKED', 'You have not blocked this user.', 'ERROR_USER_NOT_BLOCKED', HttpStatus.BAD_REQUEST);
    }

    await this.blocksRepository.unblockUser(blockerId, blockedId);
  }

  async reportUser(reporterId: string, reportedId: string, reason: ReportReason): Promise<void> {
    if (reporterId === reportedId) {
      throw new CustomHttpException('SELF_REPORT_NOT_ALLOWED', 'You cannot report yourself.', 'ERROR_SELF_REPORT_NOT_ALLOWED', HttpStatus.BAD_REQUEST);
    }

    const reportedUser = await this.usersRepository.findById(reportedId);
    if (!reportedUser) {
      throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND);
    }

    await this.reportsRepository.reportUser(reporterId, reportedId, reason);
  }
}
