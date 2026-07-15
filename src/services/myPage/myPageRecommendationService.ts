import { prisma } from "../../db";

export class MyPageRecommendationService {
  static findByUserId(userId: number) {
    return prisma.countryRecommendationResult.findMany({
      where: {
        userId,
      },
      include: {
        profile: true,
        recommendations: {
          orderBy: {
            rank: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static findByProfileId(
    userId: number,
    profileId: number,
  ) {
    return prisma.countryRecommendationResult.findMany({
      where: {
        userId,
        profileId,
      },
      include: {
        profile: true,
        recommendations: {
          orderBy: {
            rank: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}