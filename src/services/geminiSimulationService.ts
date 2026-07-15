import { geminiClient, GEMINI_MODEL } from "../lib/gemini";
import { cityRecommendationResponseSchema } from "../schemas/gemini.schema";
import { buildSimulationPrompt } from "../prompts/simulationPrompt";
import {
  geminiSimulationResponseJsonSchema,
  geminiSimulationResponseSchema,
} from "../schemas/geminiSimulation.schema";
import type { SimulationInput } from "../generated/prisma/client";
import type { SimulationGenerationResponse } from "../types/simulation";

type SimulationGenerationInput = Pick<
  SimulationInput,
  | "selectedCountry"
  | "selectedCity"
  | "initialBudget"
  | "requiredFacilities"
  | "departureAirport"
>;

// 선택된 도시 기반 시뮬레이션 Gemini 호출
export const generateSimulationResponse = async (
  input: SimulationGenerationInput,
): Promise<SimulationGenerationResponse> => {
  if (!input.selectedCity || !input.initialBudget || !input.departureAirport) {
    throw new Error("시뮬레이션 생성에 필요한 입력값이 없습니다.");
  }

  const prompt = buildSimulationPrompt({
    selectedCountry: input.selectedCountry,
    selectedCity: input.selectedCity,
    initialBudget: input.initialBudget,
    requiredFacilities: input.requiredFacilities,
    departureAirport: input.departureAirport,
  });

  const response = await geminiClient.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt.userPrompt,
    config: {
      systemInstruction: prompt.systemInstruction,
      responseMimeType: "application/json",
      responseJsonSchema: geminiSimulationResponseJsonSchema,
      temperature: 0,
    },
  });

  if (!response.text) {
    throw new Error("Gemini 시뮬레이션 응답이 비어 있습니다.");
  }

  const parsedResponse: unknown = JSON.parse(response.text);
  const validatedResponse =
    geminiSimulationResponseSchema.parse(parsedResponse);

  return validatedResponse.simulation;
};

// 간단한 도시 3개 추천 (국가만으로 추천)
export const getSimpleCityRecommendations = async (
  selectedCountry: string,
  userJob?: string,
  userLanguage?: string,
) => {
  const prompt = `
당신은 해외 이주 및 취업 도시 추천 전문가입니다.

국가: ${selectedCountry}
희망 직무: ${userJob ?? "미입력"}
사용 언어: ${userLanguage ?? "미입력"}

해당 국가에서 이주와 취업에 적합한 도시 3곳을 추천하세요.

조건:
- 모든 설명은 한국어로 작성
- 도시별 추천 이유를 2~3문장으로 작성
- 실제 도시만 추천
- 정확히 3개 도시 반환
`;

  const response = await geminiClient.models.generateContent({
    model: GEMINI_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          cities: {
            type: "array",
            minItems: 3,
            maxItems: 3,
            items: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                summary: {
                  type: "string",
                },
              },
              required: ["name", "summary"],
              additionalProperties: false,
            },
          },
        },
        required: ["cities"],
        additionalProperties: false,
      },
    },
  });

  if (!response.text) {
    throw new Error("Gemini 응답이 비어 있습니다.");
  }

  const parsed = cityRecommendationResponseSchema.parse(
    JSON.parse(response.text),
  );

  return parsed.cities;
};
