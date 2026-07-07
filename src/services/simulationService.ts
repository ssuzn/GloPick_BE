import { prisma } from "../db";
import { DepartureAirport, InitialBudget } from "../generated/prisma/client";
import { JOB_FIELDS } from "../constants/dropdownOptions";
import { createSimulationResultData } from "../utils/simulationMapper";

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
  selectedCountry: string
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
  }
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
  facilityLocations: any
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
  city: string
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
  city: string
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