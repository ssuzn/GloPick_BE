import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectDB } from "./db";
import { connectRedis } from "./lib/redis";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`서버가 http://localhost:${PORT} 에서 실행 중`);
    });
  } catch (error) {
    console.error("서버 시작 실패:", error);
    process.exit(1);
  }
};

startServer();