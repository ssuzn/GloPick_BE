import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { UnauthorizedError } from "../errors/UnauthorizedError";
import { CountryRecommendationService } from "../services/countryRecommendationService";
import { asyncHandler } from "../utils/asyncHandler";

export const getCountryRecommendations = asyncHandler(
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      throw new UnauthorizedError("사용자 인증이 필요합니다.");
    }

    const result = await CountryRecommendationService.createRecommendation(
      authReq.user.id,
      Number(req.params.profileId),
    );

    return res.status(201).json({
      success: true,
      message: "국가 추천이 완료되고 저장되었습니다.",
      data: result,
    });
  },
);