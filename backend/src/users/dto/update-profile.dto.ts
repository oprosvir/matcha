enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

enum SexualOrientation {
  STRAIGHT = 'straight',
  GAY = 'gay',
  BISEXUAL = 'bisexual',
}

export class UpdateProfileDto {
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  sexualOrientation?: SexualOrientation;
  biography?: string;
}
