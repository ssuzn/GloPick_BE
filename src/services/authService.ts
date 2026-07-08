import { prisma } from "../db";

interface CreateLocalUserParams {
  name: string;
  email: string;
  password: string;
  birth?: string;
  phone?: string;
}

interface CreateKakaoUserParams {
  name: string;
  email: string;
  kakaoId: string;
  birth?: string;
  phone?: string;
}

export class AuthService {
  static findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  static findUserByKakaoId(kakaoId: string) {
    return prisma.user.findUnique({
      where: { kakaoId },
    });
  }

  static createLocalUser(data: CreateLocalUserParams) {
    return prisma.user.create({
      data: {
        ...data,
        provider: "local",
      },
    });
  }

  static createKakaoUser(data: CreateKakaoUserParams) {
    return prisma.user.create({
      data: {
        ...data,
        provider: "kakao",
      },
    });
  }
}