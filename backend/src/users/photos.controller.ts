/// <reference types="multer" />
import {
  Controller,
  Post,
  Delete,
  Put,
  Get,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { PhotosService } from './photos.service';
import {
  UploadPhotoResponseDto,
  SetProfilePictureResponseDto,
  GetPhotosResponseDto,
} from './dto';

@Controller('users/me/photos')
@UseGuards(AuthGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  /**
   * Upload photos (max 6 per user)
   * POST /users/me/photos
   */
  @Post()
  @UseInterceptors(
    FilesInterceptor('photos', 6, {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, callback) => {
        // Only allow JPEG and PNG
        if (!file.mimetype.match(/^image\/(jpeg|png)$/)) {
          return callback(new Error('Only JPEG and PNG images are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadPhotos(
    @CurrentUser('sub') userId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<{ success: boolean; data: UploadPhotoResponseDto; messageKey: string }> {
    const photos = await this.photosService.uploadPhotos(userId, files);

    return {
      success: true,
      data: { photos },
      messageKey: 'SUCCESS_PHOTOS_UPLOADED',
    };
  }

  /**
   * Get all photos for current user
   * GET /users/me/photos
   */
  @Get()
  async getPhotos(
    @CurrentUser('sub') userId: string,
  ): Promise<{ success: boolean; data: GetPhotosResponseDto; messageKey: string }> {
    const photos = await this.photosService.getUserPhotos(userId);

    return {
      success: true,
      data: { photos },
      messageKey: 'SUCCESS_PHOTOS_RETRIEVED',
    };
  }

  /**
   * Delete a photo
   * DELETE /users/me/photos/:photoId
   */
  @Delete(':photoId')
  async deletePhoto(
    @CurrentUser('sub') userId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ): Promise<{ success: boolean; messageKey: string }> {
    await this.photosService.deletePhoto(photoId, userId);

    return {
      success: true,
      messageKey: 'SUCCESS_PHOTO_DELETED',
    };
  }

  /**
   * Set a photo as profile picture
   * PUT /users/me/photos/:photoId/profile
   */
  @Put(':photoId/profile')
  async setProfilePicture(
    @CurrentUser('sub') userId: string,
    @Param('photoId', ParseUUIDPipe) photoId: string,
  ): Promise<{ success: boolean; data: SetProfilePictureResponseDto; messageKey: string }> {
    const photo = await this.photosService.setProfilePicture(photoId, userId);

    return {
      success: true,
      data: { photo },
      messageKey: 'SUCCESS_PROFILE_PICTURE_SET',
    };
  }
}
