import { RequestHandler } from "express";
import { prisma } from "../db";

export const getPopularCountries: RequestHandler = async (req, res): Promise<void> => {
  try {
    const countries = await prisma.simulationInput.groupBy({
      by: ["selectedCountry"],
      where: { selectedCountry: { not: "" } },
      _count: { selectedCountry: true },
      orderBy: { _count: { selectedCountry: "desc" } },
      take: 5,
    });

    const result = countries.map((item) => ({
      name: item.selectedCountry,
      count: item._count.selectedCountry,
    }));

    res.status(200).json({
      code: 200,
      message: "인기 국가 순위 조회 성공",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: "서버 오류", data: null });
  }
};

export const getPopularCities: RequestHandler = async (req, res): Promise<void> => {
  try {
    const cities = await prisma.simulationInput.groupBy({
      by: ["selectedCity"],
      where: { selectedCity: { not: null } },
      _count: { selectedCity: true },
      orderBy: { _count: { selectedCity: "desc" } },
      take: 5,
    });

    const result = cities.map((item) => ({
      name: item.selectedCity,
      count: item._count.selectedCity,
    }));

    res.status(200).json({
      code: 200,
      message: "인기 도시 순위 조회 성공",
      data: result,
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: "서버 오류", data: null });
  }
};