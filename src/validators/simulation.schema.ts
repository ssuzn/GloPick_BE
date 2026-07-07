import { z } from "zod";

export const recommendCitiesSchema = z.object({
  selectedCountryIndex: z.number({
    message: "국가 인덱스는 숫자여야 합니다.",
  }),
});

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

export type RecommendCitiesRequestDto = z.infer<typeof recommendCitiesSchema>;
export type SaveSimulationRequestDto = z.infer<typeof saveSimulationInputSchema>;