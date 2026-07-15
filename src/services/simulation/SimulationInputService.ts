import { prisma } from "../../db";
import { UpdateSimulationInputData } from "../../types/simulation";

export class SimulationInputService {
  static async findById(id: number, userId: number) {
    return prisma.simulationInput.findFirst({
      where: { id, userId },
    });
  }

  static async findCompletedSimulationInputs(
    userId: number,
    profileId: number,
    selectedCountry: string,
  ) {
    return prisma.simulationInput.findMany({
      where: {
        userId,
        profileId,
        selectedCountry,
        selectedCity: { not: null },
        initialBudget: { not: null },
        departureAirport: { not: null },
      },
    });
  }

  static async updateSimulationInput(
    inputId: number,
    data: UpdateSimulationInputData,
  ) {
    return prisma.simulationInput.update({
      where: { id: inputId },
      data,
    });
  }

  static async findUserProfile(profileId: number, userId: number) {
    return prisma.userProfile.findFirst({
      where: {
        id: profileId,
        userId,
      },
    });
  }

  static async findRecommendationWithItems(
    recommendationId: number,
    userId: number,
    profileId: number,
  ) {
    return prisma.countryRecommendationResult.findFirst({
      where: {
        id: recommendationId,
        userId,
        profileId,
      },
      include: {
        recommendations: {
          orderBy: { rank: "asc" },
        },
      },
    });
  }

  static async findLatestSimulationInputByCountry(
    userId: number,
    profileId: number,
    selectedCountry: string,
  ) {
    return prisma.simulationInput.findFirst({
      where: {
        userId,
        profileId,
        selectedCountry,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async createCityRecommendationInput(
    userId: number,
    profileId: number,
    selectedCountry: string,
    recommendedCities: string[],
  ) {
    return prisma.simulationInput.create({
      data: {
        userId,
        profileId,
        selectedCountry,
        recommendedCities,
        requiredFacilities: [],
      },
    });
  }
}
