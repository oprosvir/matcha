import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersRepository } from './repositories/users.repository';
import { PublicUserResponseDto, PrivateUserResponseDto } from './dto/user-response.dto';
import { User } from './repositories/users.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { LikesRepository } from './repositories/likes.repository';
import { LikeSent, LikeReceived } from './repositories/likes.repository';
import { ChatRepository } from 'src/chat/repositories/chat.repository';

@Injectable()
export class UserService {
  constructor(private readonly usersRepository: UsersRepository, private readonly likesRepository: LikesRepository, private readonly chatRepository: ChatRepository) { }

  private mapUserToPublicUserResponseDto(user: User): PublicUserResponseDto | null {
    if (!user) return null;
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      gender: user.gender,
      biography: user.biography,
      fameRating: user.fame_rating,
      latitude: user.latitude,
      longitude: user.longitude,
      lastTimeActive: user.last_time_active?.toISOString() || null,
      createdAt: user.created_at.toISOString(),
      interests: user.interests,
      photos: user.photos,
    };
  }

  private mapUserToPrivateUserResponseDto(user: User): PrivateUserResponseDto {
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      gender: user.gender,
      sexualOrientation: user.sexual_orientation,
      biography: user.biography,
      fameRating: user.fame_rating,
      latitude: user.latitude,
      longitude: user.longitude,
      lastTimeActive: user.last_time_active?.toISOString() || null,
      createdAt: user.created_at.toISOString(),
      email: user.email,
      username: user.username,
      isEmailVerified: user.is_email_verified,
      interests: user.interests,
      photos: user.photos,
    };
  }

  async findPublicProfileById(id: string): Promise<PublicUserResponseDto | null> {
    const user: User | null = await this.usersRepository.findById(id);
    if (!user) return null;
    return this.mapUserToPublicUserResponseDto(user);
  }

  async findByUsername(username: string): Promise<PrivateUserResponseDto | null> {
    const user: User | null = await this.usersRepository.findByUsername(username);
    if (!user) return null;
    return this.mapUserToPrivateUserResponseDto(user);
  }

  async findByEmailOrUsername(email: string, username: string): Promise<PrivateUserResponseDto | null> {
    const user: User | null = await this.usersRepository.findByEmailOrUsername(email, username);
    if (!user) return null;
    return this.mapUserToPrivateUserResponseDto(user);
  }

  async findById(id: string): Promise<PrivateUserResponseDto | null> {
    const user: User | null = await this.usersRepository.findById(id);
    if (!user) return null;
    return this.mapUserToPrivateUserResponseDto(user);
  }

  async findByEmail(email: string): Promise<PrivateUserResponseDto | null> {
    const user: User | null = await this.usersRepository.findByEmail(email);
    if (!user) return null;
    return this.mapUserToPrivateUserResponseDto(user);
  }

  async create(createUserDto: CreateUserDto): Promise<PrivateUserResponseDto> {
    const existingUser = await this.findByEmailOrUsername(
      createUserDto.email,
      createUserDto.username,
    );
    if (existingUser) throw new CustomHttpException('USERNAME_OR_EMAIL_ALREADY_EXISTS', 'Username or email already exists.', 'ERROR_USERNAME_OR_EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);
    const user: User = await this.usersRepository.create({ ...createUserDto, password: passwordHash });
    return this.mapUserToPrivateUserResponseDto(user);
  }

  async validatePassword(username: string, password: string): Promise<boolean> {
    const user: User | null = await this.usersRepository.findByUsername(username);
    if (!user) return false;
    return bcrypt.compare(password, user.password_hash);
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hash = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.updatePassword(userId, hash);
  }

  async updateEmailVerified(userId: string, isEmailVerified: boolean): Promise<void> {
    await this.usersRepository.updateEmailVerified(userId, isEmailVerified);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<PrivateUserResponseDto> {
    const user: User = await this.usersRepository.updateProfile(userId, {
      firstName: updateProfileDto.firstName,
      lastName: updateProfileDto.lastName,
      gender: updateProfileDto.gender,
      sexualOrientation: updateProfileDto.sexualOrientation,
      biography: updateProfileDto.biography,
    });
    return this.mapUserToPrivateUserResponseDto(user);
  }

  async findAllMatches(userId: string): Promise<PublicUserResponseDto[]> {
    const usersWhoUserLiked: LikeSent[] = await this.likesRepository.findAllUsersWhoUserLiked(userId);
    console.log("users I liked: ", usersWhoUserLiked);
    const usersWhoLikedUser: LikeReceived[] = await this.likesRepository.findAllUsersWhoLikedUserId(userId);
    console.log("users who liked me: ", usersWhoLikedUser);
    const usersWhoLikedUserSet: Set<string> = new Set(usersWhoLikedUser.map(like => like.from_user_id));
    const matches: string[] = usersWhoUserLiked.filter(like => usersWhoLikedUserSet.has(like.to_user_id)).map(like => like.to_user_id);
    const matchesPublic: PublicUserResponseDto[] = [];
    for (const match of matches) {
      const user = await this.findPublicProfileById(match);
      if (user) {
        matchesPublic.push(user);
      }
    }
    console.log("matches: ", matchesPublic);
    return matchesPublic;
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
    // Match found!
    // - Create chat
    // - Send notification to both users
    // - Increase fame rating of both users
    if (hasUserLikedUser) {
      await this.chatRepository.createChat(fromUserId, toUserId);
      // TODO: Send notification to both users
      // TODO: Increase fame rating of both users
    }
  }
}

