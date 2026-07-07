import { REQUIRED_FACILITIES } from "../constants/dropdownOptions";
import { DepartureAirport, InitialBudget, SimulationInput } from "../generated/prisma/client";

export const toInitialBudgetEnum = (budget: string): InitialBudget => {
  const map: Record<string, InitialBudget> = {
    "300만~500만원": "BUDGET_300_500",
    "500만~800만원": "BUDGET_500_800",
    "800만~1200만원": "BUDGET_800_1200",
    "1200만~1500만원": "BUDGET_1200_1500",
    "1500만원 이상": "BUDGET_1500_PLUS",
  };

  return map[budget];
};

export const toDepartureAirportEnum = (airport: string): DepartureAirport => {
  const map: Record<string, DepartureAirport> = {
    인천국제공항: "ICN",
    김포국제공항: "GMP",
    김해국제공항: "PUS",
    제주국제공항: "CJU",
    청주국제공항: "CJJ",
    대구국제공항: "TAE",
    무안국제공항: "MWX",
  };

  return map[airport];
};

export const validateSimulationInput = (
  input: SimulationInput,
  cityIndex: number,
  initialBudget: string,
  requiredFacilities: string[],
  departureAirport: string
): { isValid: boolean; error?: { code: number; message: string } } => {
  if (
    isNaN(cityIndex) ||
    cityIndex < 0 ||
    cityIndex >= (input.recommendedCities?.length || 0)
  ) {
    return {
      isValid: false,
      error: { code: 400, message: "유효하지 않은 도시 인덱스입니다. (0-2 범위)" },
    };
  }

  if (!initialBudget) {
    return {
      isValid: false,
      error: { code: 400, message: "초기 정착 예산을 입력해주세요." },
    };
  }

  if (!Array.isArray(requiredFacilities) || requiredFacilities.length === 0) {
    return {
      isValid: false,
      error: { code: 400, message: "필요한 시설을 최소 1개 이상 선택해주세요." },
    };
  }

  if (requiredFacilities.length > 5) {
    return {
      isValid: false,
      error: { code: 400, message: "필수 편의시설은 최대 5개까지 선택할 수 있습니다." },
    };
  }

  const validFacilities: string[] = REQUIRED_FACILITIES.map(
    (f) => f.value
  );
  const invalidFacilities = requiredFacilities.filter(
    (f) => !validFacilities.includes(f)
  );

  if (invalidFacilities.length > 0) {
    return {
      isValid: false,
      error: {
        code: 400,
        message: `유효하지 않은 시설: ${invalidFacilities.join(", ")}`,
      },
    };
  }

  if (!departureAirport) {
    return {
      isValid: false,
      error: { code: 400, message: "출발 공항을 선택해주세요." },
    };
  }

  if (!toInitialBudgetEnum(initialBudget)) {
    return {
      isValid: false,
      error: { code: 400, message: "유효하지 않은 예산 범위입니다." },
    };
  }

  if (!toDepartureAirportEnum(departureAirport)) {
    return {
      isValid: false,
      error: { code: 400, message: "유효하지 않은 출발 공항입니다." },
    };
  }

  return { isValid: true };
};