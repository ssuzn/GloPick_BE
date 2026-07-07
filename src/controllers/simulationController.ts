import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { prisma } from "../db";
import { createFlightLinks } from "../utils/flightLinkGenerator";
import { searchFacilities, getCityCenter } from "../services/googleMapsService";
import { validateSimulationInput } from "../utils/simulationValidator";
import {
  findSimulationInput,
  saveSimulation,
} from "../services/simulationService";
import { createCityRecommendations } from "../services/cityRecommendationService";
import {
  RecommendCitiesRequestDto,
  SaveSimulationRequestDto,
} from "../dto/simulation.dto";

export const saveSimulationInput = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      selectedCityIndex,
      initialBudget,
      requiredFacilities,
      departureAirport,
    }: SaveSimulationRequestDto = req.body;

    const input = await findSimulationInput(Number(id), req.user!.id);

    if (!input) {
      return res.status(404).json({
        code: 404,
        message: "입력 정보를 찾을 수 없습니다.",
        data: null,
      });
    }

    if (selectedCityIndex === undefined || selectedCityIndex === null) {
      return res.status(400).json({
        code: 400,
        message: "도시 인덱스를 입력해주세요.",
        data: null,
      });
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

    const result = await saveSimulation({
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
  } catch (error) {
    console.error("시뮬레이션 입력 및 생성 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "시뮬레이션 생성 실패",
      data: null,
    });
  }
};

export const recommendCities = async (req: AuthRequest, res: Response) => {
  try {
    const { recommendationId, profileId } = req.params;
    const { selectedCountryIndex }: RecommendCitiesRequestDto = req.body;

    const result = await createCityRecommendations({
      userId: req.user!.id,
      recommendationId: Number(recommendationId),
      profileId: Number(profileId),
      selectedCountryIndex: Number(selectedCountryIndex),
    });

    return res.status(result.statusCode).json(result.body);
  } catch (error) {
    console.error("도시 추천 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "도시 추천 실패",
      data: null,
    });
  }
};

export const getSimulationFlightLinks = async (
  req: AuthRequest,
  res: Response,
) => {
  try {
    const { id } = req.params;

    const simulation = await prisma.simulationInput.findFirst({
      where: {
        id: Number(id),
        userId: req.user!.id,
      },
    });

    if (!simulation) {
      return res.status(404).json({
        code: 404,
        message: "시뮬레이션 입력 정보를 찾을 수 없습니다.",
        data: null,
      });
    }

    if (!simulation.departureAirport || !simulation.selectedCity) {
      return res.status(400).json({
        code: 400,
        message: "출발 공항 또는 선택 도시 정보가 없습니다.",
        data: null,
      });
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
  } catch (error) {
    console.error("항공권 링크 생성 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "서버 오류",
      data: null,
    });
  }
};

export const getSimulationList = async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    console.error("시뮬레이션 요약 조회 실패:", error);
    return res.status(500).json({
      code: 500,
      message: "시뮬레이션 요약 조회 실패",
    });
  }
};

export const testGoogleMaps = async (req: Request, res: Response) => {
  try {
    const { city, country, facilities } = req.body;

    if (!city || !country || !facilities || !Array.isArray(facilities)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: "city, country, facilities(배열)가 필요합니다.",
        data: null,
      });
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
  } catch (error) {
    console.error("❌ Google Maps API 테스트 실패:", error);
    return res.status(500).json({
      success: false,
      code: 500,
      message: "Google Maps API 호출 중 오류가 발생했습니다.",
      data: null,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
