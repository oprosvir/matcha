import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserRequestDto } from './dto/create-user/create-user-request.dto';
import { UpdateProfileRequestDto } from './dto/update-profile/update-profile-request.dto';
import { UsersRepository } from './repositories/users.repository';
import { PublicUserDto } from './dto/user.dto';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { LikesRepository } from './repositories/likes.repository';
import { LikeSent, LikeReceived } from './repositories/likes.repository';
import { ChatRepository } from 'src/chat/repositories/chat.repository';
import { PrivateUserDto } from './dto/user.dto';
import { UpdateProfileResponseDto } from './dto/update-profile/update-profile-response.dto';
import { FindAllMatchesResponseDto } from './dto/find-all-matches/find-all-matches-response.dto';
import { NotificationService } from 'src/notifications/notification.service';
import { NotificationType } from 'src/common/enums/notification-type';

@Injectable()
export class UserService {
  constructor(private readonly usersRepository: UsersRepository, private readonly likesRepository: LikesRepository, private readonly chatRepository: ChatRepository, private readonly notificationService: NotificationService) { }

  private mapUserToPublicUserResponseDto(user: PrivateUserDto): PublicUserDto | null {
    if (!user) return null;
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      biography: user.biography,
      fameRating: user.fameRating,
      latitude: user.latitude,
      longitude: user.longitude,
      lastTimeActive: user.lastTimeActive || null,
      createdAt: user.createdAt,
      interests: user.interests,
      photos: user.photos,
    };
  }

  async findPublicProfileById(id: string): Promise<PublicUserDto | null> {
    const user: PrivateUserDto | null = await this.usersRepository.findById(id);
    if (!user) return null;
    return this.mapUserToPublicUserResponseDto(user);
  }

  async findByUsername(username: string): Promise<PrivateUserDto | null> {
    const user: PrivateUserDto | null = await this.usersRepository.findByUsername(username);
    return user;
  }

  async findByEmailOrUsername(email: string, username: string): Promise<PrivateUserDto | null> {
    return await this.usersRepository.findByEmailOrUsername(email, username);
  }

  async findById(id: string): Promise<PrivateUserDto> {
    const user: PrivateUserDto = await this.usersRepository.findById(id);
    return user;
  }

  async findByEmail(email: string): Promise<PrivateUserDto | null> {
    const user: PrivateUserDto | null = await this.usersRepository.findByEmail(email);
    return user;
  }

  async create(createUserDto: CreateUserRequestDto): Promise<PrivateUserDto> {
    const existingUser = await this.findByEmailOrUsername(
      createUserDto.email,
      createUserDto.username,
    );
    if (existingUser) throw new CustomHttpException('USERNAME_OR_EMAIL_ALREADY_EXISTS', 'Username or email already exists.', 'ERROR_USERNAME_OR_EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    return await this.usersRepository.create({ ...createUserDto, passwordHash: passwordHash });
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

  async updateProfile(userId: string, updates: UpdateProfileRequestDto): Promise<UpdateProfileResponseDto> {
    return await this.usersRepository.updateProfile(userId, updates);
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
}

