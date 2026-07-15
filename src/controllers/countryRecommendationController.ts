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
    const startedAt = performance.now();

    const result = await CountryRecommendationService.createRecommendation(
      authReq.user.id,
      Number(req.params.profileId),
    );
    const processingTimeMs = Number((performance.now() - startedAt).toFixed(2));

    return res.status(result.isExisting ? 200 : 201).json({
      success: true,

      message: result.isExisting
        ? "기존 추천 결과를 반환했습니다."
        : "국가 추천이 완료되고 저장되었습니다.",

      data: {
        ...result,

        processingTimeMs,
      },
    });
  },
);
