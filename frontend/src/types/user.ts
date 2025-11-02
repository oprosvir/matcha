import { z } from "zod";

export const InterestSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Interest = z.infer<typeof InterestSchema>;;

export const GenderSchema = z.enum(['male', 'female']);
export type Gender = z.infer<typeof GenderSchema>;
export const SexualOrientationSchema = z.enum(['straight', 'gay', 'bisexual']);
export type SexualOrientation = z.infer<typeof SexualOrientationSchema>;

export const PhotoSchema = z.object({
  id: z.string(),
  url: z.string(),
  isProfilePic: z.boolean(),
});
export type Photo = z.infer<typeof PhotoSchema>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string().nullable(),
  gender: GenderSchema.nullable(),
  sexualOrientation: SexualOrientationSchema.nullable(),
  biography: z.string().nullable(),
  profileCompleted: z.boolean(),
  fameRating: z.number(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  email: z.string(),
  isEmailVerified: z.boolean(),
  createdAt: z.string().transform((str) => new Date(str)),
  lastTimeActive: z.string().nullable().transform((str) => str ? new Date(str) : null),
  photos: z.array(PhotoSchema),
  interests: z.array(InterestSchema),
});
export type User = z.infer<typeof UserSchema>;

export const ProfileSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  gender: GenderSchema.nullable(),
  biography: z.string().nullable(),
  fameRating: z.number(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  lastTimeActive: z.string().nullable().transform((str) => str ? new Date(str) : null),
  createdAt: z.string().transform((str) => new Date(str)),
  photos: z.array(PhotoSchema),
  interests: z.array(InterestSchema),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfilePreviewSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  profilePicture: z.string(),
});
export type ProfilePreview = z.infer<typeof ProfilePreviewSchema>;

export const MatchesSchema = z.array(ProfileSchema);
export type Matches = z.infer<typeof MatchesSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string(),
});
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

export const AccessTokenSchema = z.object({
  accessToken: z.string(),
});
export type AccessToken = z.infer<typeof AccessTokenSchema>;

export const UserSessionSchema = z.object({
  accessToken: AccessTokenSchema,
  isAuthenticated: z.boolean(),
});
export type UserSession = z.infer<typeof UserSessionSchema>;