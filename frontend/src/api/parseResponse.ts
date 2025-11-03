import { z } from 'zod';

export async function parseApiResponse<T>(promise: Promise<any>, schema: z.ZodSchema<T>): Promise<T> {
  const raw = await promise;
  console.log('Raw response:', raw);
  const result = schema.safeParse(raw);
  console.log('Result:', result);
  if (!result.success) {
    console.error('ERROR: ', result.error);
    throw new Error("Failed to handle the service response. Please try again later.");
  }
  return result.data;
}
