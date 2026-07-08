import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { prisma } from "../db";
import { createFlightLinks } from "../utils/flightLinkGenerator";
import { searchFacilities, getCityCenter } from "../services/googleMapsService";
import { validateSimulationInput } from "../utils/simulationValidator";
import { createCityRecommendations } from "../services/cityRecommendationService";
import {
  recommendCitiesSchema,
  saveSimulationInputSchema,
} from "../validators/simulation.schema";
import { BadRequestError } from "../errors/BadRequestError";
import { SimulationInputService } from "../services/simulation/SimulationInputService";
import { SimulationService } from "../services/simulationService";

export const saveSimulationInput = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const parseResult = saveSimulationInputSchema.safeParse(req.body);

  if (!parseResult.success) {
    throw new BadRequestError(
      parseResult.error.issues[0]?.message || "요청값이 올바르지 않습니다.",
    );
  }

  const {
    selectedCityIndex,
    initialBudget,
    requiredFacilities,
    departureAirport,
  } = parseResult.data;

  const input = await SimulationInputService.findSimulationInput(
    Number(id),
    req.user!.id,
  );

  if (!input) {
    throw new BadRequestError("입력 정보를 찾을 수 없습니다.");
  }

  if (selectedCityIndex === undefined || selectedCityIndex === null) {
    throw new BadRequestError("도시 인덱스를 입력해주세요.");
  }

  const cityIndex = Number(selectedCityIndex);

  const validation = validateSimulationInput(
    input,
    cityIndex,
    initialBudget,
    requiredFacilities,
    departureAirport,
  );

  if (!validation.isValid) {
    return res.status(validation.error!.code).json({
      code: validation.error!.code,
      message: validation.error!.message,
      data: null,
    });
  }

  const result = await SimulationService.saveSimulation({
    input,
    userId: req.user!.id,
    cityIndex,
    initialBudget,
    requiredFacilities,
    departureAirport,
  });

  return res.status(result.isExisting ? 200 : 201).json({
    code: result.isExisting ? 200 : 201,
    message: result.isExisting
      ? "이미 동일한 조건으로 시뮬레이션이 생성되어 있습니다."
      : "시뮬레이션 입력 및 생성 완료",
    data: result,
  });
};

export const recommendCities = async (req: AuthRequest, res: Response) => {
  const { recommendationId, profileId } = req.params;
  const parseResult = recommendCitiesSchema.safeParse(req.body);

  if (!parseResult.success) {
    throw new BadRequestError(
      parseResult.error.issues[0]?.message || "요청값이 올바르지 않습니다.",
    );
  }

  const { selectedCountryIndex } = parseResult.data;

  const result = await createCityRecommendations({
    userId: req.user!.id,
    recommendationId: Number(recommendationId),
    profileId: Number(profileId),
    selectedCountryIndex: Number(selectedCountryIndex),
  });

  return res.status(result.statusCode).json(result.body);
};

export const getSimulationFlightLinks = async (
  req: AuthRequest,
  res: Response,
) => {
  const { id } = req.params;

  const simulation = await prisma.simulationInput.findFirst({
    where: {
      id: Number(id),
      userId: req.user!.id,
    },
  });

  if (!simulation) {
    throw new BadRequestError("시뮬레이션 입력 정보를 찾을 수 없습니다.");
  }

  if (!simulation.departureAirport || !simulation.selectedCity) {
    throw new BadRequestError("출발 공항 또는 선택 도시 정보가 없습니다.");
  }

  const flightLinks = createFlightLinks(
    simulation.departureAirport,
    simulation.selectedCity,
  );

  return res.status(200).json({
    code: 200,
    message: "항공권 링크 생성 완료",
    data: {
      simulation: {
        id: simulation.id,
        departureAirport: simulation.departureAirport,
        selectedCity: simulation.selectedCity,
      },
      flightLinks,
    },
  });
};

export const getSimulationList = async (req: AuthRequest, res: Response) => {
  const simulations = await prisma.simulationList.findMany({
    where: {
      userId: req.user!.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return res.status(200).json({
    code: 200,
    message: "시뮬레이션 요약 조회 성공",
    data: simulations,
  });
};

export const testGoogleMaps = async (req: Request, res: Response) => {
  const { city, country, facilities } = req.body;

  if (!city || !country || !facilities || !Array.isArray(facilities)) {
    throw new BadRequestError("city, country, facilities(배열)가 필요합니다.");
  }

  const mapCenter = await getCityCenter(city, country);
  const facilityLocations = await searchFacilities(city, country, facilities);

  return res.status(200).json({
    success: true,
    code: 200,
    message: "Google Maps API 테스트 성공",
    data: {
      mapCenter,
      facilityLocations,
      summary: {
        city,
        country,
        facilitiesSearched: facilities.length,
        totalLocationsFound: Object.values(facilityLocations).reduce(
          (sum: number, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
          0,
        ),
      },
    },
  });
};
