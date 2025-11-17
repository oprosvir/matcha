import { z } from "zod";

export const ProfileViewSchema = z.object({
  id: z.string(),
  viewedAt: z.string(),
  viewer: z.object({
    id: z.string(),
    username: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    profilePicture: z.string().nullable(),
  }),
});

export type ProfileView = z.infer<typeof ProfileViewSchema>;
