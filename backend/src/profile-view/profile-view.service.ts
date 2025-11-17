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

    // Update fame rating for the user whose profile was viewed
    try {
      await this.userRepository.updateFameRating(createProfileViewRequestDto.userId);
    } catch (error) {
      console.error('Failed to update fame rating after profile view:', error);
    }
  }

  async getProfileViews(userId: string): Promise<GetProfileViewResponseDto> {
    const profileViews: ProfileView[] = await this.profileViewRepository.getProfileViews(userId);
    const users = await this.userRepository.findAllPreviewByIds(profileViews.map(profileView => profileView.viewer_id));

    // Create a map for quick lookup
    const usersMap = new Map(users.map(user => [user.id, user]));

    return {
      profileViews: profileViews.map(view => {
        const viewer = usersMap.get(view.viewer_id);
        return {
          id: view.id,
          viewedAt: view.viewed_at.toISOString(),
          viewer: {
            id: viewer.id,
            username: viewer.username,
            firstName: viewer.firstName,
            lastName: viewer.lastName,
            profilePicture: viewer.profilePicture,
          }
        };
      })
    };
  }
}
