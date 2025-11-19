import { z } from 'zod';

export async function parseApiResponse<T>(promise: Promise<any>, schema: z.ZodSchema<T>): Promise<T> {
  const raw = await promise;
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new Error("Failed to handle the service response. Please try again later.");
  }
  return result.data;
}
