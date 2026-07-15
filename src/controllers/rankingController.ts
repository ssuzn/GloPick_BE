import { RequestHandler } from "express";
import { RankingService } from "../services/rankingService";

export const getPopularCountries: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  const result = await RankingService.getPopularCountries();

  res.status(200).json({
    code: 200,
    message: "인기 국가 순위 조회 성공",
    data: result,
  });
};

export const getPopularCities: RequestHandler = async (
  req,
  res,
): Promise<void> => {
  const result = await RankingService.getPopularCities();

  res.status(200).json({
    code: 200,
    message: "인기 도시 순위 조회 성공",
    data: result,
  });
};
