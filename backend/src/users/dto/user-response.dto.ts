enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

enum SexualOrientation {
  STRAIGHT = 'straight',
  GAY = 'gay',
  BISEXUAL = 'bisexual',
}

export class PublicUserResponseDto {
  firstName: string;
  lastName: string;
  gender: Gender;
  biography: string;
  fameRating: number;
  latitude: number;
  longitude: number;
  lastTimeActive: Date;
  createdAt: Date;
}

export class PrivateUserResponseDto extends PublicUserResponseDto {
  id: string;
  email: string;
  username: string;
  isEmailVerified: boolean;
  sexualOrientation: SexualOrientation;
}