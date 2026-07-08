import { prisma } from "../db";

export class RankingService {
  static async getPopularCountries() {
    const countries = await prisma.simulationInput.groupBy({
      by: ["selectedCountry"],
      where: {
        selectedCountry: {
          not: "",
        },
      },
      _count: {
        selectedCountry: true,
      },
      orderBy: {
        _count: {
          selectedCountry: "desc",
        },
      },
      take: 5,
    });

    return countries.map((item) => ({
      name: item.selectedCountry,
      count: item._count.selectedCountry,
    }));
  }

  static async getPopularCities() {
    const cities = await prisma.simulationInput.groupBy({
      by: ["selectedCity"],
      where: {
        selectedCity: {
          not: null,
        },
      },
      _count: {
        selectedCity: true,
      },
      orderBy: {
        _count: {
          selectedCity: "desc",
        },
      },
      take: 5,
    });

    return cities.map((item) => ({
      name: item.selectedCity,
      count: item._count.selectedCity,
    }));
  }
}