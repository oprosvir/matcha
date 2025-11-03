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

const ResolveCityNameAndCountryNameByLatitudeAndLongitudeResponseSchema = z.object({
  cityName: z.string(),
  countryName: z.string(),
});

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

@Injectable()
export class UserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly interestRepository: InterestRepository,
    private readonly db: DatabaseService,
    private readonly likesRepository: LikesRepository,
    private readonly chatRepository: ChatRepository,
    private readonly notificationService: NotificationService,
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

  async completeProfile(userId: string, dto: CompleteProfileRequestDto): Promise<CompleteProfileResponseDto> {
    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) { throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND); }
    if (existingUser.profile_completed) { throw new CustomHttpException('PROFILE_ALREADY_COMPLETED', 'Profile already completed', 'ERROR_PROFILE_ALREADY_COMPLETED', HttpStatus.BAD_REQUEST); }

    // Use a transaction to ensure both operations succeed or fail together
    const user = await this.db.transaction(async (client) => {
      await this.interestRepository.updateUserInterests(userId, dto.interestIds, client);

      const user = await this.usersRepository.completeProfile(
        userId,
        {
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          sexualOrientation: dto.sexualOrientation,
          biography: dto.biography,
        },
        client
      );
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
}
