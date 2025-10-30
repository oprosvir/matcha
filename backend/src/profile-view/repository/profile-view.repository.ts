import { DatabaseService } from "src/database/database.service";
import { CreateProfileViewRequestDto } from "../dto/create-profile-view/create-profile-view-request.dto";
import { CustomHttpException } from "src/common/exceptions/custom-http.exception";
import { HttpStatus } from "@nestjs/common";

export interface ProfileView {
  id: string;
  viewer_id: string;
  viewed_id: string;
  created_at: Date;
}

export class ProfileViewRepository {
  constructor(private readonly db: DatabaseService) { }

  async createProfileView(currentUserId: string, createProfileViewRequestDto: CreateProfileViewRequestDto) {
    try {
      await this.db.query(
        'INSERT INTO profile_views (viewer_id, viewed_id) VALUES ($1, $2)',
        [currentUserId, createProfileViewRequestDto.userId]
      );
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getProfileViews(userId: string): Promise<ProfileView[]> {
    try {
      const result = await this.db.query<ProfileView>(
        'SELECT * FROM profile_views WHERE viewed_id = $1',
        [userId]
      );
      return result.rows;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getMostRecentProfileView(userId: string): Promise<ProfileView | null> {
    try {
      const result = await this.db.query<ProfileView>(
        'SELECT * FROM profile_views WHERE viewed_id = $1 ORDER BY created_at DESC LIMIT 1',
        [userId]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error(error);
      throw new CustomHttpException('INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.', 'ERROR_INTERNAL_SERVER', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}