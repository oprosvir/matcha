import { Gender, SexualOrientation } from "../enums/user.enums";

export class UserPhotoDto {
  id: string;
  url: string;
  isProfilePic: boolean;
}

export class UserInterestDto {
  id: string;
  name: string;
}

export class PublicUserDto {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
  gender: Gender | null;
  sexualOrientation: SexualOrientation | null;
  biography: string | null;
  fameRating: number;
  latitude: number | null;
  longitude: number | null;
  cityName: string | null;
  countryName: string | null;
  lastTimeActive: string | null;
  createdAt: string;
  photos: UserPhotoDto[];
  interests: UserInterestDto[];
}

export class PrivateUserDto extends PublicUserDto {
  email: string;
  isEmailVerified: boolean;
  profileCompleted: boolean;
}
