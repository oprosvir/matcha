import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { UsersRepository } from './repositories/users.repository';
import { PublicUserResponseDto, PrivateUserResponseDto } from './dto/user-response.dto';
import { User } from './repositories/users.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import { InterestRepository } from 'src/interests/repository/interest.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly interestRepository: InterestRepository,
  ) { }

  private mapUserToPublicUserResponseDto(user: User): PublicUserResponseDto | null {
    if (!user) return null;
    return {
      firstName: user.first_name,
      lastName: user.last_name,
      dateOfBirth: user.date_of_birth,
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
      dateOfBirth: user.date_of_birth,
      gender: user.gender,
      sexualOrientation: user.sexual_orientation,
      biography: user.biography,
      profileCompleted: user.profile_completed,
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

  async completeProfile(userId: string, completeProfileDto: CompleteProfileDto): Promise<PrivateUserResponseDto> {
    const existingUser = await this.usersRepository.findById(userId);
    if (!existingUser) { throw new CustomHttpException('USER_NOT_FOUND', 'User not found', 'ERROR_USER_NOT_FOUND', HttpStatus.NOT_FOUND); }
    if (existingUser.profile_completed) { throw new CustomHttpException('PROFILE_ALREADY_COMPLETED', 'Profile already completed', 'ERROR_PROFILE_ALREADY_COMPLETED', HttpStatus.BAD_REQUEST); }

    // Save user interests
    await this.interestRepository.updateUserInterests(userId, completeProfileDto.interestIds);

    // Complete profile
    const user: User = await this.usersRepository.completeProfile(userId, {
      dateOfBirth: completeProfileDto.dateOfBirth,
      gender: completeProfileDto.gender,
      sexualOrientation: completeProfileDto.sexualOrientation,
      biography: completeProfileDto.biography,
    });
    return this.mapUserToPrivateUserResponseDto(user);
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
}
