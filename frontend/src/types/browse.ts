import z from "zod";

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