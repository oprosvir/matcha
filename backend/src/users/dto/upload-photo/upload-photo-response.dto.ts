export class PhotoDto {
  id: string;
  url: string;
  isProfilePic: boolean;
  createdAt: string;
}

export class UploadPhotoResponseDto {
  photo: PhotoDto;
}

export class SetProfilePictureResponseDto {
  photo: PhotoDto;
}

export class GetPhotosResponseDto {
  photos: PhotoDto[];
}
