import { User } from "../generated/prisma/client";

export type AuthUser = Omit<User, "password"> & {
  _id: number; // 기존 MongoDB 코드 호환용
};