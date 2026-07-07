import { prisma } from "../db";
import { DepartureAirport, InitialBudget } from "../generated/prisma/client";
import { JOB_FIELDS } from "../constants/dropdownOptions";
import { createSimulationResultData } from "../utils/simulationMapper";
import { generateSimulationResponse } from "./gptsimulationService";
import { searchFacilities } from "./googleMapsService";
import { createFlightLinks } from "../utils/flightLinkGenerator";
import { formatSimulationResult } from "../utils/simulationMapper";
import {
  toInitialBudgetEnum,
  toDepartureAirportEnum,
} from "../utils/simulationValidator";

export const findSimulationInput = async (id: number, userId: number) => {
  return prisma.simulationInput.findFirst({
    where: {
      id,
      userId,
    },
  });
};

export const findCompletedSimulationInputs = async (
  userId: number,
  profileId: number,
  selectedCountry: string,
) => {
  return prisma.simulationInput.findMany({
    where: {
      userId,
      profileId,
      selectedCountry,
      selectedCity: {
        not: null,
      },
      initialBudget: {
        not: null,
      },
      departureAirport: {
        not: null,
      },
    },
  });
};

export const findSimulationResult = async (inputId: number, userId: number) => {
  return prisma.simulationResult.findFirst({
    where: {
      inputId,
      userId,
    },
  });
};

export const updateSimulationInput = async (
  inputId: number,
  data: {
    selectedCity: string;
    initialBudget: InitialBudget;
    requiredFacilities: string[];
    departureAirport: DepartureAirport;
  },
) => {
  return prisma.simulationInput.update({
    where: {
      id: inputId,
    },
    data,
  });
};

export const createSimulationResult = async (
  userId: number,
  inputId: number,
  selectedCountry: string,
  gptResult: any,
  facilityLocations: any,
) => {
  return prisma.simulationResult.create({
    data: {
      userId,
      inputId,
      country: selectedCountry,
      ...createSimulationResultData(gptResult, facilityLocations),
    },
  });
};

export const findUserProfile = async (profileId: number, userId: number) => {
  return prisma.userProfile.findFirst({
    where: {
      id: profileId,
      userId,
    },
  });
};

export const getDesiredJobName = (desiredJob?: string | null) => {
  const jobCode = desiredJob ? desiredJob.replace("JOB_", "") : "2";
  const jobField =
    JOB_FIELDS.find((field) => field.code === jobCode) || JOB_FIELDS[1];

  return jobField.nameKo;
};

export const findSimulationListItem = async (
  userId: number,
  job: string,
  country: string,
  city: string,
) => {
  return prisma.simulationList.findFirst({
    where: {
      userId,
      job,
      country,
      city,
    },
  });
};

export const createSimulationListItem = async (
  userId: number,
  job: string,
  country: string,
  city: string,
) => {
  return prisma.simulationList.create({
    data: {
      userId,
      job,
      country,
      city,
    },
  });
};

export const findRecommendationWithItems = async (
  recommendationId: number,
  userId: number,
  profileId: number,
) => {
  return prisma.countryRecommendationResult.findFirst({
    where: {
      id: recommendationId,
      userId,
      profileId,
    },
    include: {
      recommendations: {
        orderBy: {
          rank: "asc",
        },
      },
    },
  });
};

export const findLatestSimulationInputByCountry = async (
  userId: number,
  profileId: number,
  selectedCountry: string,
) => {
  return prisma.simulationInput.findFirst({
    where: {
      userId,
      profileId,
      selectedCountry,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const createCityRecommendationInput = async (
  userId: number,
  profileId: number,
  selectedCountry: string,
  recommendedCities: string[],
) => {
  return prisma.simulationInput.create({
    data: {
      userId,
      profileId,
      selectedCountry,
      recommendedCities,
      requiredFacilities: [],
    },
  });
};

export const generateSimulationResult = async ({
  input,
  userId,
  departureAirport,
  selectedCity,
}: {
  input: any;
  userId: number;
  departureAirport: string;
  selectedCity: string;
}) => {
  const gptResult = await generateSimulationResponse(input as any);

  const arrivalAirportCode = gptResult?.nearestAirport?.code || selectedCity;

  const flightLinks = createFlightLinks(departureAirport, arrivalAirportCode);

  let facilityLocations = {};

  if (input.requiredFacilities.length > 0) {
    try {
      facilityLocations = await searchFacilities(
        selectedCity,
        input.selectedCountry,
        input.requiredFacilities,
      );
    } catch (error) {
      console.error("Google Maps API 호출 실패:", error);
    }
  }

  const saved = await createSimulationResult(
    userId,
    input.id,
    input.selectedCountry,
    gptResult,
    facilityLocations,
  );

  return {
    simulationId: saved.id,
    result: formatSimulationResult(saved),
    flightLinks,
  };
};

export const saveSimulation = async ({
  input,
  userId,
  cityIndex,
  initialBudget,
  requiredFacilities,
  departureAirport,
}: {
  input: any;
  userId: number;
  cityIndex: number;
  initialBudget: string;
  requiredFacilities: string[];
  departureAirport: string;
}) => {
  const actualSelectedCity = input.recommendedCities[cityIndex];

  const existingInputs = await findCompletedSimulationInputs(
    userId,
    input.profileId,
    input.selectedCountry,
  );

  const sortedRequiredFacilities = [...requiredFacilities].sort().join(",");

  const existingInput = existingInputs.find((existing) => {
    const sortedExisting = [...(existing.requiredFacilities || [])]
      .sort()
      .join(",");

    return (
      existing.selectedCity === actualSelectedCity &&
      existing.initialBudget === toInitialBudgetEnum(initialBudget) &&
      existing.departureAirport === toDepartureAirportEnum(departureAirport) &&
      sortedExisting === sortedRequiredFacilities
    );
  });

  if (existingInput) {
    const existingSimulation = await findSimulationResult(
      existingInput.id,
      userId,
    );

    if (existingSimulation) {
      const flightLinks = createFlightLinks(
        departureAirport,
        existingInput.selectedCity as string,
      );

      return {
        isExisting: true,
        inputId: existingInput.id,
        simulationId: existingSimulation.id,
        result: formatSimulationResult(existingSimulation),
        flightLinks,
      };
    }
  }

  const updatedInput = await updateSimulationInput(input.id, {
    selectedCity: actualSelectedCity,
    initialBudget: toInitialBudgetEnum(initialBudget),
    requiredFacilities,
    departureAirport: toDepartureAirportEnum(departureAirport),
  });

  const generated = await generateSimulationResult({
    input: updatedInput,
    userId,
    departureAirport,
    selectedCity: actualSelectedCity,
  });

  const userProfile = await findUserProfile(updatedInput.profileId, userId);
  const desiredJob = getDesiredJobName(userProfile?.desiredJob);

  const isAlreadyExist = await findSimulationListItem(
    userId,
    desiredJob,
    updatedInput.selectedCountry,
    actualSelectedCity,
  );

  if (!isAlreadyExist) {
    await createSimulationListItem(
      userId,
      desiredJob,
      updatedInput.selectedCountry,
      actualSelectedCity,
    );
  }

  return {
    isExisting: false,
    inputId: updatedInput.id,
    ...generated,
  };
};
