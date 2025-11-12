/// <reference types="multer" />
import { HttpStatus, Injectable } from '@nestjs/common';
import { PhotosRepository, Photo } from './repositories/photos.repository';
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
}

@Injectable()
export class PhotosService {
  constructor(private readonly photosRepository: PhotosRepository) {}

  /**
   * Upload photos for a user
   * @param userId - User ID
   * @param files - Array of uploaded files from multer
   * @returns Array of created photo records
   */
  async uploadPhotos(userId: string, files: Express.Multer.File[]): Promise<PhotoUploadResult[]> {
    // Validation: Check if files array is empty
    if (!files || files.length === 0) {
      throw new CustomHttpException(
        'NO_FILES_PROVIDED',
        'No files provided for upload',
        'ERROR_NO_FILES',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validation: Check max photos per user
    const currentPhotoCount = await this.photosRepository.getUserPhotoCount(userId);
    const totalAfterUpload = currentPhotoCount + files.length;

    if (totalAfterUpload > MAX_PHOTOS_PER_USER) {
      throw new CustomHttpException(
        'MAX_PHOTOS_EXCEEDED',
        `Maximum ${MAX_PHOTOS_PER_USER} photos allowed per user. You currently have ${currentPhotoCount} photos.`,
        'ERROR_MAX_PHOTOS_EXCEEDED',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate each file
    for (const file of files) {
      await this.validateFile(file);
    }

    // Process and save files
    const uploadedPhotos: PhotoUploadResult[] = [];
    const userUploadDir = path.join(UPLOAD_DIR, userId);

    try {
      // Ensure user upload directory exists
      await fs.mkdir(userUploadDir, { recursive: true });

      // Determine if first photo should be profile picture
      const isFirstPhoto = currentPhotoCount === 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isProfilePic = isFirstPhoto && i === 0;

        // Process and save file
        const photoResult = await this.processAndSaveFile(userId, file, userUploadDir, isProfilePic);
        uploadedPhotos.push(photoResult);
      }

      return uploadedPhotos;
    } catch (error) {
      // Cleanup: Delete any uploaded files if error occurs
      await this.cleanupFiles(uploadedPhotos.map(p => p.url));

      if (error instanceof CustomHttpException) {
        throw error;
      }

      console.error('Error uploading photos:', error);
      throw new CustomHttpException(
        'PHOTO_UPLOAD_FAILED',
        'Failed to upload photos',
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
    // Delete from database (includes authorization check)
    const deletedPhoto = await this.photosRepository.deletePhoto(photoId, userId);

    // Delete file from filesystem
    await this.deleteFileFromDisk(deletedPhoto.url);
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
  ): Promise<PhotoUploadResult> {
    // Generate unique filename
    const fileExtension = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filename = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(userUploadDir, filename);

    // Process image with Sharp (optimize and convert to JPEG if needed)
    await sharp(file.buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    // Create database record
    const url = `/uploads/users/${userId}/${filename}`;
    const photo = await this.photosRepository.createPhoto(userId, url, isProfilePic);

    return {
      id: photo.id,
      url: photo.url,
      isProfilePic: photo.is_profile_pic,
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
      // Log error but don't throw - database record is already deleted
      console.error(`Failed to delete file from disk: ${url}`, error);
    }
  }

  /**
   * Cleanup files (used in error handling)
   */
  private async cleanupFiles(urls: string[]): Promise<void> {
    for (const url of urls) {
      await this.deleteFileFromDisk(url);
    }
  }

  /**
   * Delete all photos for a user (used when deleting user account)
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
      console.error(`Failed to delete user upload directory: ${userUploadDir}`, error);
    }
  }
}
