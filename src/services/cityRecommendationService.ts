import { getSimpleCityRecommendations } from "./gptsimulationService";
import {
  createCityRecommendationInput,
  findLatestSimulationInputByCountry,
  findRecommendationWithItems,
  findUserProfile,
  getDesiredJobName,
} from "./simulationService";

type CityRecommendation = {
  name: string;
  summary: string;
};

export const createCityRecommendations = async ({
  userId,
  recommendationId,
  profileId,
  selectedCountryIndex,
}: {
  userId: number;
  recommendationId: number;
  profileId: number;
  selectedCountryIndex: number;
}) => {
  const recommendation = await findRecommendationWithItems(
    recommendationId,
    userId,
    profileId,
  );

  if (!recommendation) {
    return {
      statusCode: 404,
      body: {
        code: 404,
        message: "추천 결과를 찾을 수 없습니다.",
        data: null,
      },
    };
  }

  if (
    selectedCountryIndex < 0 ||
    selectedCountryIndex >= recommendation.recommendations.length
  ) {
    return {
      statusCode: 400,
      body: {
        code: 400,
        message: "유효하지 않은 국가 인덱스입니다.",
        data: null,
      },
    };
  }

  const selectedCountry =
    recommendation.recommendations[selectedCountryIndex].country;

  const existingInput = await findLatestSimulationInputByCountry(
    userId,
    profileId,
    selectedCountry,
  );

  if (existingInput) {
    return {
      statusCode: 409,
      body: {
        code: 409,
        message: "이미 해당 국가에 대한 도시 추천을 받았습니다.",
        data: {
          isExisting: true,
          inputId: existingInput.id,
          selectedCountry: existingInput.selectedCountry,
          recommendedCities: existingInput.recommendedCities,
        },
      },
    };
  }

  const profile = await findUserProfile(profileId, userId);

  if (!profile) {
    return {
      statusCode: 404,
      body: {
        code: 404,
        message: "프로필을 찾을 수 없습니다.",
        data: null,
      },
    };
  }

  const userJob = getDesiredJobName(profile.desiredJob);
  const userLanguage = profile.language;

  const cityRecommendations = (await getSimpleCityRecommendations(
    selectedCountry,
    userJob || undefined,
    userLanguage || undefined,
  )) as CityRecommendation[];

  const newInput = await createCityRecommendationInput(
    userId,
    profileId,
    selectedCountry,
    cityRecommendations.map((city) => city.name),
  );

  return {
    statusCode: 200,
    body: {
      code: 200,
      message: "도시 추천 성공",
      data: {
        isExisting: false,
        inputId: newInput.id,
        selectedCountry,
        recommendedCities: cityRecommendations,
      },
    },
  };
};
