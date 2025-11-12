import { HttpStatus, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from 'src/database/database.service';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';

export interface Photo {
  id: string;
  user_id: string;
  url: string;
  is_profile_pic: boolean;
  created_at: Date;
}

@Injectable()
export class PhotosRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Create a new photo record in the database
   */
  async createPhoto(
    userId: string,
    url: string,
    isProfilePic: boolean,
    client?: PoolClient,
  ): Promise<Photo> {
    const query = `
      INSERT INTO user_photos (user_id, url, is_profile_pic)
      VALUES ($1, $2, $3)
      RETURNING id, user_id, url, is_profile_pic, created_at
    `;

    try {
      const result = client
        ? await client.query<Photo>(query, [userId, url, isProfilePic])
        : await this.db.query<Photo>(query, [userId, url, isProfilePic]);

      if (!result.rows[0]) {
        throw new CustomHttpException(
          'PHOTO_CREATION_FAILED',
          'Failed to create photo record',
          'ERROR_PHOTO_CREATION_FAILED',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      // Handle unique constraint violation for profile picture
      if (error.code === '23505' && error.constraint === 'one_profile_pic_per_user') {
        throw new CustomHttpException(
          'PROFILE_PIC_ALREADY_EXISTS',
          'You already have a profile picture. Please remove it first.',
          'ERROR_PROFILE_PIC_EXISTS',
          HttpStatus.CONFLICT,
        );
      }
      console.error('Error creating photo:', error);
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while creating photo',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a photo by ID
   */
  async getPhotoById(photoId: string): Promise<Photo | null> {
    const query = `
      SELECT id, user_id, url, is_profile_pic, created_at
      FROM user_photos
      WHERE id = $1
    `;

    try {
      const result = await this.db.query<Photo>(query, [photoId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting photo by ID:', error);
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while fetching photo',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all photos for a user
   */
  async getUserPhotos(userId: string): Promise<Photo[]> {
    const query = `
      SELECT id, user_id, url, is_profile_pic, created_at
      FROM user_photos
      WHERE user_id = $1
      ORDER BY is_profile_pic DESC, created_at ASC
    `;

    try {
      const result = await this.db.query<Photo>(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user photos:', error);
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while fetching photos',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get count of photos for a user
   */
  async getUserPhotoCount(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM user_photos
      WHERE user_id = $1
    `;

    try {
      const result = await this.db.query<{ count: string }>(query, [userId]);
      return parseInt(result.rows[0]?.count || '0', 10);
    } catch (error) {
      console.error('Error getting user photo count:', error);
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while counting photos',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a photo by ID (with authorization check)
   */
  async deletePhoto(photoId: string, userId: string): Promise<Photo> {
    const query = `
      DELETE FROM user_photos
      WHERE id = $1 AND user_id = $2
      RETURNING id, user_id, url, is_profile_pic, created_at
    `;

    try {
      const result = await this.db.query<Photo>(query, [photoId, userId]);

      if (!result.rows[0]) {
        throw new CustomHttpException(
          'PHOTO_NOT_FOUND',
          'Photo not found or you do not have permission to delete it',
          'ERROR_PHOTO_NOT_FOUND',
          HttpStatus.NOT_FOUND,
        );
      }

      return result.rows[0];
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      console.error('Error deleting photo:', error);
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while deleting photo',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Set a photo as profile picture (removes profile pic flag from other photos)
   */
  async setProfilePicture(photoId: string, userId: string): Promise<Photo> {
    try {
      return await this.db.transaction(async (client) => {
        // First, verify the photo exists and belongs to the user
        const checkQuery = `
          SELECT id, user_id, url, is_profile_pic, created_at
          FROM user_photos
          WHERE id = $1 AND user_id = $2
        `;
        const checkResult = await client.query<Photo>(checkQuery, [photoId, userId]);

        if (!checkResult.rows[0]) {
          throw new CustomHttpException(
            'PHOTO_NOT_FOUND',
            'Photo not found or you do not have permission to modify it',
            'ERROR_PHOTO_NOT_FOUND',
            HttpStatus.NOT_FOUND,
          );
        }

        // Remove profile pic flag from all user's photos
        await client.query(
          `UPDATE user_photos SET is_profile_pic = FALSE WHERE user_id = $1`,
          [userId],
        );

        // Set the specified photo as profile picture
        const updateQuery = `
          UPDATE user_photos
          SET is_profile_pic = TRUE
          WHERE id = $1 AND user_id = $2
          RETURNING id, user_id, url, is_profile_pic, created_at
        `;
        const result = await client.query<Photo>(updateQuery, [photoId, userId]);

        return result.rows[0];
      });
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      console.error('Error setting profile picture:', error);
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while setting profile picture',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete all photos for a user (used when deleting user account)
   */
  async deleteAllUserPhotos(userId: string): Promise<Photo[]> {
    const query = `
      DELETE FROM user_photos
      WHERE user_id = $1
      RETURNING id, user_id, url, is_profile_pic, created_at
    `;

    try {
      const result = await this.db.query<Photo>(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error deleting all user photos:', error);
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while deleting photos',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get user's profile picture
   */
  async getProfilePicture(userId: string): Promise<Photo | null> {
    const query = `
      SELECT id, user_id, url, is_profile_pic, created_at
      FROM user_photos
      WHERE user_id = $1 AND is_profile_pic = TRUE
      LIMIT 1
    `;

    try {
      const result = await this.db.query<Photo>(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting profile picture:', error);
      throw new CustomHttpException(
        'INTERNAL_SERVER_ERROR',
        'An unexpected error occurred while fetching profile picture',
        'ERROR_INTERNAL_SERVER',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
