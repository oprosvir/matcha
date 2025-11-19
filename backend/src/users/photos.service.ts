/// <reference types="multer" />
import { HttpStatus, Injectable } from '@nestjs/common';
import { PhotosRepository } from './repositories/photos.repository';
import { CustomHttpException } from 'src/common/exceptions/custom-http.exception';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

const MAX_PHOTOS_PER_USER = 6;
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'users');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'];

export interface PhotoUploadResult {
  id: string;
  url: string;
  isProfilePic: boolean;
  createdAt: string;
}

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

@Injectable()
export class PhotosService {
  constructor(private readonly photosRepository: PhotosRepository) { }

  /**
   * Upload a single photo for a user
   * @param userId - User ID
   * @param file - Uploaded file from multer
   * @param cropData - Optional crop coordinates to apply before resizing
   * @returns Created photo record
   */
  async uploadPhoto(userId: string, file: Express.Multer.File, cropData?: CropData): Promise<PhotoUploadResult> {
    // Validation: Check if file exists
    if (!file) {
      throw new CustomHttpException(
        'NO_FILES_PROVIDED',
        'No file provided for upload',
        'ERROR_NO_FILES',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validation: Check max photos per user
    const currentPhotoCount = await this.photosRepository.getUserPhotoCount(userId);

    if (currentPhotoCount >= MAX_PHOTOS_PER_USER) {
      throw new CustomHttpException(
        'MAX_PHOTOS_EXCEEDED',
        `Maximum ${MAX_PHOTOS_PER_USER} photos allowed per user.`,
        'ERROR_MAX_PHOTOS_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate file
    await this.validateFile(file);

    // Process and save file
    const userUploadDir = path.join(UPLOAD_DIR, userId);

    try {
      await fs.mkdir(userUploadDir, { recursive: true });

      const isFirstPhoto = currentPhotoCount === 0;
      const isProfilePic = isFirstPhoto;

      const photoResult = await this.processAndSaveFile(userId, file, userUploadDir, isProfilePic, cropData);

      return photoResult;
    } catch (error) {
      // Rethrow known custom exceptions
      if (error instanceof CustomHttpException) {
        throw error;
      }

      // Wrap unknown errors
      throw new CustomHttpException(
        'PHOTO_UPLOAD_FAILED',
        'Failed to upload photo',
        'ERROR_PHOTO_UPLOAD_FAILED',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Delete a photo
   * @param photoId - Photo ID
   * @param userId - User ID (for authorization)
   */
  async deletePhoto(photoId: string, userId: string): Promise<void> {
    // Check current photo count before deletion
    const currentPhotoCount = await this.photosRepository.getUserPhotoCount(userId);

    // Prevent deleting the last photo
    if (currentPhotoCount <= 1) {
      throw new CustomHttpException(
        'CANNOT_DELETE_LAST_PHOTO',
        'You must have at least one photo. Please upload a new photo before deleting this one.',
        'ERROR_CANNOT_DELETE_LAST_PHOTO',
        HttpStatus.BAD_REQUEST,
      );
    }

    const deletedPhoto = await this.photosRepository.deletePhoto(photoId, userId);

    await this.deleteFileFromDisk(deletedPhoto.url);

    // If deleted photo was the profile picture, auto-promote another photo
    if (deletedPhoto.is_profile_pic) {
      const remainingPhotos = await this.photosRepository.getUserPhotos(userId);

      // If user still has photos, set the first one as profile picture
      if (remainingPhotos.length > 0) {
        await this.photosRepository.setProfilePicture(remainingPhotos[0].id, userId);
      }
    }
  }

  /**
   * Set a photo as profile picture
   * @param photoId - Photo ID
   * @param userId - User ID (for authorization)
   */
  async setProfilePicture(photoId: string, userId: string): Promise<PhotoUploadResult> {
    const photo = await this.photosRepository.setProfilePicture(photoId, userId);

    return {
      id: photo.id,
      url: photo.url,
      isProfilePic: photo.is_profile_pic,
      createdAt: photo.created_at.toISOString(),
    };
  }

  /**
   * Get all photos for a user
   */
  async getUserPhotos(userId: string): Promise<PhotoUploadResult[]> {
    const photos = await this.photosRepository.getUserPhotos(userId);

    return photos.map((photo) => ({
      id: photo.id,
      url: photo.url,
      isProfilePic: photo.is_profile_pic,
      createdAt: photo.created_at.toISOString(),
    }));
  }

  /**
   * Validate uploaded file
   */
  private async validateFile(file: Express.Multer.File): Promise<void> {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      throw new CustomHttpException(
        'FILE_TOO_LARGE',
        `File ${file.originalname} exceeds maximum size of 5MB`,
        'ERROR_FILE_TOO_LARGE',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new CustomHttpException(
        'INVALID_FILE_TYPE',
        `File ${file.originalname} has invalid type. Only JPEG and PNG are allowed.`,
        'ERROR_INVALID_FILE_TYPE',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate file is actually an image using Sharp (checks magic bytes)
    try {
      const metadata = await sharp(file.buffer).metadata();

      if (!metadata || !metadata.format) {
        throw new Error('Invalid image format');
      }

      // Ensure format matches MIME type
      const formatMimeMap: Record<string, string> = {
        jpeg: 'image/jpeg',
        jpg: 'image/jpeg',
        png: 'image/png',
      };

      const expectedMime = formatMimeMap[metadata.format];
      if (expectedMime !== file.mimetype) {
        throw new CustomHttpException(
          'MIME_TYPE_MISMATCH',
          'File extension does not match file content',
          'ERROR_MIME_MISMATCH',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate minimum dimensions (200x200)
      const MIN_WIDTH = 200;
      const MIN_HEIGHT = 200;
      if (!metadata.width || !metadata.height) {
        throw new Error('Cannot determine image dimensions');
      }

      if (metadata.width < MIN_WIDTH || metadata.height < MIN_HEIGHT) {
        throw new CustomHttpException(
          'IMAGE_TOO_SMALL',
          `Image dimensions must be at least ${MIN_WIDTH}x${MIN_HEIGHT} pixels. Your image is ${metadata.width}x${metadata.height}`,
          'ERROR_IMAGE_TOO_SMALL',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate aspect ratio (reject extreme proportions)
      const MAX_ASPECT_RATIO = 3; // Maximum 3:1 or 1:3 ratio
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > MAX_ASPECT_RATIO || aspectRatio < (1 / MAX_ASPECT_RATIO)) {
        throw new CustomHttpException(
          'INVALID_ASPECT_RATIO',
          `Image aspect ratio is too extreme. Maximum ratio is ${MAX_ASPECT_RATIO}:1`,
          'ERROR_INVALID_ASPECT_RATIO',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof CustomHttpException) {
        throw error;
      }
      throw new CustomHttpException(
        'INVALID_IMAGE_FILE',
        `File ${file.originalname} is not a valid image`,
        'ERROR_INVALID_IMAGE',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Process file with Sharp and save to disk
   */
  private async processAndSaveFile(
    userId: string,
    file: Express.Multer.File,
    userUploadDir: string,
    isProfilePic: boolean,
    cropData?: CropData,
  ): Promise<PhotoUploadResult> {
    // Generate unique filename
    const fileExtension = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filename = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(userUploadDir, filename);

    // Process image with Sharp
    // First, apply EXIF rotation to fix orientation issues
    let sharpInstance = sharp(file.buffer).rotate();

    // If cropData is provided, apply it (extract the crop area)
    if (cropData) {
      sharpInstance = sharpInstance.extract({
        left: Math.round(cropData.x),
        top: Math.round(cropData.y),
        width: Math.round(cropData.width),
        height: Math.round(cropData.height),
      });
    }

    // Then resize to square (1024x1024) for consistent display across all views
    await sharpInstance
      .resize(1024, 1024, {
        fit: 'cover',           // Crop to fill the square
        position: 'center'      // Center the crop area
      })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    // Create database record
    const url = `/uploads/users/${userId}/${filename}`;
    const photo = await this.photosRepository.createPhoto(userId, url, isProfilePic);

    return {
      id: photo.id,
      url: photo.url,
      isProfilePic: photo.is_profile_pic,
      createdAt: photo.created_at.toISOString(),
    };
  }

  /**
   * Delete file from disk
   */
  private async deleteFileFromDisk(url: string): Promise<void> {
    try {
      // Convert URL to filesystem path
      // URL format: /uploads/users/{userId}/{filename}
      const filePath = path.join(process.cwd(), url);
      await fs.unlink(filePath);
    } catch (error) {
      // Silently fail - database record is already deleted
    }
  }

  /**
   * Delete all photos for a user
   */
  async deleteAllUserPhotos(userId: string): Promise<void> {
    const photos = await this.photosRepository.deleteAllUserPhotos(userId);

    // Delete all files from disk
    for (const photo of photos) {
      await this.deleteFileFromDisk(photo.url);
    }

    // Delete user's upload directory
    const userUploadDir = path.join(UPLOAD_DIR, userId);
    try {
      await fs.rmdir(userUploadDir);
    } catch (error) {
      // Silently fail - directory may not exist or may not be empty
    }
  }
}
