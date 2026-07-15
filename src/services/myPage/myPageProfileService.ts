import { prisma } from "../../db";

export class MyPageProfileService {
  static findByUserId(userId: number) {
    return prisma.userProfile.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  static findById(id: number, userId: number) {
    return prisma.userProfile.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  static update(id: number, data: Record<string, unknown>) {
    return prisma.userProfile.update({
      where: { id },
      data,
    });
  }

  static delete(id: number) {
    return prisma.userProfile.delete({
      where: { id },
    });
  }
}