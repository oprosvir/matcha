import { Injectable } from '@nestjs/common';
import { createClient } from 'redis';

@Injectable()
export class AuthRepository {
  constructor() { }
  private readonly redisClient = createClient({
    url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  });

  async onModuleInit() {
    await this.redisClient.connect();
    console.log("Redis client connected");
  }

  async setEntry(key: string, value: string, expiration: number): Promise<void> {
    await this.redisClient.set(key, value, { EX: expiration });
  }

  async getEntry(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }

  async deleteEntry(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}