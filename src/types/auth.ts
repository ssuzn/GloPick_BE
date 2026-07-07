import { User } from "../generated/prisma/client";

export type AuthUser = Omit<User, "password">;