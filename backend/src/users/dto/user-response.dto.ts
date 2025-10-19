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
  gender: Gender | null;
  biography: string | null;
  fameRating: number;
  latitude: number | null;
  longitude: number | null;
  lastTimeActive: Date | null;
  createdAt: Date;
}

export class PrivateUserResponseDto extends PublicUserResponseDto {
  id: string;
  email: string;
  username: string;
  isEmailVerified: boolean;
  sexualOrientation: SexualOrientation | null;
}