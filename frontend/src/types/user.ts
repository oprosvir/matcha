import type { Interest } from "./interest";

const Gender = {
  MALE: 'male',
  FEMALE: 'female',
} as const;

const SexualOrientation = {
  STRAIGHT: 'straight',
  GAY: 'gay',
  BISEXUAL: 'bisexual',
} as const;

type Gender = typeof Gender[keyof typeof Gender];
type SexualOrientation = typeof SexualOrientation[keyof typeof SexualOrientation];

export interface Photo {
  id: number;
  url: string;
  is_profile_pic: boolean;
}

// TODO: make 'photos' and 'interests' required after backend is added
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  gender: Gender | null;
  sexualOrientation: SexualOrientation | null;
  biography: string | null;
  fameRating: number;
  latitude: number | null;
  longitude: number | null;
  email: string;
  isEmailVerified: boolean;
  createdAt: Date;
  lastTimeActive: Date | null;
  photos?: Photo[];
  interests?: Interest[];
}

// Domain types for authentication
export interface AuthToken {
  accessToken: string;
}

export interface UserSession {
  token: AuthToken;
  isAuthenticated: boolean;
}
