import { z } from 'zod';

export async function parseApiResponse<T>(promise: Promise<any>, schema: z.ZodSchema<T>): Promise<T> {
  const raw = await promise;
  const result = schema.safeParse(raw);

  if (!result.success) {
    console.error('API response validation failed', result.error);
    throw new Error('Invalid API response structure');
  }

  return result.data;
}