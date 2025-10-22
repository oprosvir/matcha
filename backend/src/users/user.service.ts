import { HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersRepository } from './repositories/users.repository';
import { PublicUserResponseDto, PrivateUserResponseDto } from './dto/user-response.dto';
import { User } from './repositories/users.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';

@Injectable()
export class UserService {
  constructor(private readonly usersRepository: UsersRepository) { }

  private mapUserToPublicUserResponseDto(user: User): PublicUserResponseDto | null {
    if (!user) return null;
    return {
      firstName: user.first_name,
      lastName: user.last_name,
      gender: user.gender,
      biography: user.biography,
      fameRating: user.fame_rating,
      latitude: user.latitude,
      longitude: user.longitude,
      lastTimeActive: user.last_time_active,
      createdAt: user.created_at,
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
      lastTimeActive: user.last_time_active,
      createdAt: user.created_at,
      email: user.email,
      username: user.username,
      isEmailVerified: user.is_email_verified,
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
