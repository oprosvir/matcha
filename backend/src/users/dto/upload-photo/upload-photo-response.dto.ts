export class PhotoDto {
  id: string;
  url: string;
  isProfilePic: boolean;
}

export class UploadPhotoResponseDto {
  photos: PhotoDto[];
}

export class SetProfilePictureResponseDto {
  photo: PhotoDto;
}

export class GetPhotosResponseDto {
  photos: PhotoDto[];
}
