import { prisma } from "../../db";

export class SimulationListService {
  static async findByUserId(userId: number) {
    return prisma.simulationList.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async findSimulationListItem(
    userId: number,
    job: string,
    country: string,
    city: string,
  ) {
    return prisma.simulationList.findFirst({
      where: {
        userId,
        job,
        country,
        city,
      },
    });
  }

  static async createSimulationListItem(
    userId: number,
    job: string,
    country: string,
    city: string,
  ) {
    return prisma.simulationList.create({
      data: {
        userId,
        job,
        country,
        city,
      },
    });
  }
}
