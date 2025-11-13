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
  UploadedFile,
  ParseUUIDPipe,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorators';
import { PhotosService } from './photos.service';
import {
  UploadPhotoResponseDto,
  SetProfilePictureResponseDto,
  GetPhotosResponseDto,
  CropDataDto,
} from './dto';

@Controller('users/me/photos')
@UseGuards(AuthGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  /**
   * Upload a single photo (max 6 per user total)
   * POST /users/me/photos
   */
  @Post()
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (_req, file, callback) => {
        // Only allow JPEG and PNG
        if (!file.mimetype.match(/^image\/(jpeg|png)$/)) {
          return callback(new Error('Only JPEG and PNG images are allowed'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadPhoto(
    @CurrentUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('cropData') cropDataJson?: string,
  ): Promise<{ success: boolean; data: UploadPhotoResponseDto; messageKey: string }> {
    // Parse cropData if provided (sent as JSON string in FormData)
    let cropData: CropDataDto | undefined;
    if (cropDataJson) {
      try {
        cropData = JSON.parse(cropDataJson);
      } catch (error) {
        // Invalid JSON, ignore cropData
        cropData = undefined;
      }
    }

    const photo = await this.photosService.uploadPhoto(userId, file, cropData);

    return {
      success: true,
      data: { photo },
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
