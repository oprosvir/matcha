import { Gender, SexualOrientation } from '../enums/user.enums';

export interface UserPhoto {
  id: string;
  url: string;
  is_main: boolean;
}

export interface UserInterest {
  id: string;
  name: string;
}

export class PublicUserResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender | null;
  biography: string | null;
  fameRating: number;
  latitude: number | null;
  longitude: number | null;
  lastTimeActive: string | null;
  createdAt: string;
  photos: UserPhoto[];
  interests: UserInterest[];
}

export class PrivateUserResponseDto extends PublicUserResponseDto {
  email: string;
  username: string;
  isEmailVerified: boolean;
  sexualOrientation: SexualOrientation | null;
}