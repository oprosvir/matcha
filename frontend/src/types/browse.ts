import z from "zod";
import { InterestSchema } from "./user";

export const LocationEntrySchema = z.object({
  cityName: z.string(),
  countryName: z.string(),
  count: z.number(),
});

export const LocationListSchema = z.object({
  locations: z.array(LocationEntrySchema),
});

export type LocationEntry = z.infer<typeof LocationEntrySchema>;
export type LocationList = z.infer<typeof LocationListSchema>;

export const UserListItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  profilePicture: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  age: z.number(),
  fameRating: z.number(),
  cityName: z.string().nullable(),
  countryName: z.string().nullable(),
  interests: z.array(InterestSchema)
});

export const GetUsersResponseSchema = z.object({
  users: z.array(UserListItemSchema),
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
});

export type UserListItem = z.infer<typeof UserListItemSchema>;
export type GetUsersResponse = z.infer<typeof GetUsersResponseSchema>;