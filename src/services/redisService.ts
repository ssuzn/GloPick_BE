import { redisClient } from "../lib/redis";

export class RedisService {
  static async get<T>(key: string): Promise<T | null> {
    const cachedValue = await redisClient.get(key);

    if (!cachedValue) {
      return null;
    }

    return JSON.parse(cachedValue) as T;
  }

  static async set(
    key: string,
    value: unknown,
    ttlSeconds = 60 * 60,
  ): Promise<void> {
    await redisClient.set(key, JSON.stringify(value), {
      EX: ttlSeconds,
    });
  }

  static async delete(key: string): Promise<void> {
    await redisClient.del(key);
  }
}