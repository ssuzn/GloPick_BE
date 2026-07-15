import { z } from "zod";

export const cityRecommendationResponseSchema = z.object({
  cities: z
    .array(
      z.object({
        name: z.string().min(1),
        summary: z.string().min(1),
      }),
    )
    .length(3),
});

export type CityRecommendationResponse = z.infer<
  typeof cityRecommendationResponseSchema
>;