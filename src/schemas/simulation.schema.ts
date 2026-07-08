import { z } from "zod";

export const saveSimulationInputSchema = z.object({
  selectedCityIndex: z.number({
    message: "도시 인덱스는 숫자여야 합니다.",
  }),
  initialBudget: z.string().min(1, "초기 정착 예산을 입력해주세요."),
  requiredFacilities: z
    .array(z.string())
    .min(1, "필요한 시설을 최소 1개 이상 선택해주세요.")
    .max(5, "필수 편의시설은 최대 5개까지 선택할 수 있습니다."),
  departureAirport: z.string().min(1, "출발 공항을 선택해주세요."),
});

export const recommendCitiesSchema = z.object({
  selectedCountryIndex: z.number({
    message: "국가 인덱스는 숫자여야 합니다.",
  }),
});

export type SaveSimulationInputDto = z.infer<typeof saveSimulationInputSchema>;
export type RecommendCitiesDto = z.infer<typeof recommendCitiesSchema>;

export const recommendCitiesParamsSchema = z.object({
  recommendationId: z.coerce.number().int().positive(),
  profileId: z.coerce.number().int().positive(),
});

export const saveSimulationParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const simulationIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const googleMapsTestSchema = z.object({
  city: z.string().min(1),
  country: z.string().min(1),
  facilities: z.array(z.string()),
});

export type RecommendCitiesParamsDto = z.infer<
  typeof recommendCitiesParamsSchema
>;
export type SaveSimulationParamsDto = z.infer<
  typeof saveSimulationParamsSchema
>;
export type SimulationIdParamsDto = z.infer<typeof simulationIdParamsSchema>;
export type GoogleMapsTestDto = z.infer<typeof googleMapsTestSchema>;
