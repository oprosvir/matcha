import { z } from "zod";

export const InterestSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type Interest = z.infer<typeof InterestSchema>;

export const InterestsSchema = z.array(InterestSchema);
export type Interests = z.infer<typeof InterestsSchema>;

export const GenderSchema = z.enum(['male', 'female']);
export type Gender = z.infer<typeof GenderSchema>;
export const SexualOrientationSchema = z.enum(['straight', 'gay', 'bisexual']);
export type SexualOrientation = z.infer<typeof SexualOrientationSchema>;

export const PhotoSchema = z.object({
  id: z.number(),
  url: z.string(),
  is_profile_pic: z.boolean(),
});
export type Photo = z.infer<typeof PhotoSchema>;

export const PhotosSchema = z.array(PhotoSchema);
export type Photos = z.infer<typeof PhotosSchema>;

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string().nullable(),
  gender: GenderSchema.nullable(),
  sexualOrientation: SexualOrientationSchema.nullable(),
  biography: z.string().nullable(),
  profileCompleted: z.boolean(),
  fameRating: z.number(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  email: z.string(),
  isEmailVerified: z.boolean(),
  createdAt: z.string().transform((str) => new Date(str)),
  lastTimeActive: z.string().nullable().transform((str) => str ? new Date(str) : null),
  photos: PhotosSchema,
  interests: InterestsSchema,
});
export type User = z.infer<typeof UserSchema>;

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
