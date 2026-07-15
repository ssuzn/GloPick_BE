import { createClient } from "redis";

export const redisClient = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

redisClient.on("connect", () => {
  console.log("Redis 연결 성공");
});

redisClient.on("error", (error) => {
  console.error("Redis 연결 실패:", error);
});

export const connectRedis = async () => {
  if (redisClient.isOpen) return;

  await redisClient.connect();
};