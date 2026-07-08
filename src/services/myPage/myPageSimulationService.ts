import { prisma } from "../../db";

export class MyPageSimulationService {
  static findByUserId(userId: number) {
    return prisma.simulationResult.findMany({
      where: {
        userId,
      },
      include: {
        input: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static findByProfileId(userId: number, profileId: number) {
    return prisma.simulationResult.findMany({
      where: {
        userId,
        input: {
          profileId,
        },
      },
      include: {
        input: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
}