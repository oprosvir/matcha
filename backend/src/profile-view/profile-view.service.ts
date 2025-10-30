import { Injectable } from '@nestjs/common';
import { CreateProfileViewRequestDto } from './dto/create-profile-view/create-profile-view-request.dto';
import { GetProfileViewResponseDto } from './dto/get-profile-view/get-profile-view-response.dto';
import { ProfileViewRepository } from './repository/profile-view.repository';
import { ProfileView } from './repository/profile-view.repository';
import { UsersRepository } from 'src/users/repositories/users.repository';
import { NotificationType } from 'src/common/enums/notification-type';
import { NotificationService } from 'src/notifications/notification.service';

@Injectable()
export class ProfileViewService {
  constructor(private readonly profileViewRepository: ProfileViewRepository, private readonly userRepository: UsersRepository, private readonly notificationService: NotificationService) { }

  async createProfileView(currentUserId: string, createProfileViewRequestDto: CreateProfileViewRequestDto) {
    const mostRecentProfileView: ProfileView | null = await this.profileViewRepository.getMostRecentProfileView(createProfileViewRequestDto.userId);
    if (mostRecentProfileView?.viewer_id === currentUserId) { // Skip inserting a duplicate consecutive view
      return;
    }
    await this.profileViewRepository.createProfileView(currentUserId, createProfileViewRequestDto);
    await this.notificationService.createNotification({
      userId: createProfileViewRequestDto.userId,
      type: NotificationType.VIEW,
      sourceUserId: currentUserId,
    });
  }

  async getProfileViews(userId: string): Promise<GetProfileViewResponseDto> {
    const profileViews: ProfileView[] = await this.profileViewRepository.getProfileViews(userId);
    const users = await this.userRepository.findAllPreviewByIds(profileViews.map(profileView => profileView.viewer_id));
    return {
      users: users.map(user => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePicture: user.profilePicture,
      }))
    };
  }
}
