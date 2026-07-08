import {
  DepartureAirport,
  InitialBudget,
  SimulationInput,
} from "../generated/prisma/client";

export interface SaveSimulationParams {
  input: SimulationInput;
  userId: number;
  cityIndex: number;
  initialBudget: string;
  requiredFacilities: string[];
  departureAirport: string;
}

export interface UpdateSimulationInputData {
  selectedCity: string;
  initialBudget: InitialBudget;
  requiredFacilities: string[];
  departureAirport: DepartureAirport;
}

export interface GenerateSimulationResultParams {
  input: SimulationInput;
  userId: number;
  departureAirport: string;
  selectedCity: string;
}

export interface GPTSimulationResponse {
  recommendedCity?: string;
  nearestAirport?: {
    code?: string;
    name?: string;
  };
  localInfo?: {
    essentialFacilities?: string[];
    publicTransport?: string;
    safetyLevel?: string;
    climateSummary?: string;
    koreanCommunity?: string;
    culturalTips?: string;
    warnings?: string;
  };
  estimatedMonthlyCost?: {
    housing?: string;
    food?: string;
    transportation?: string;
    etc?: string;
    total?: string;
    oneYearCost?: string;
    costCuttingTips?: string;
    cpi?: string;
  };
  initialSetup?: {
    shortTermHousingOptions?: string[];
    longTermHousingPlatforms?: string[];
    mobilePlan?: string;
    bankAccount?: string;
  };
  jobReality?: {
    jobSearchPlatforms?: string[];
    languageRequirement?: string;
    visaLimitationTips?: string;
  };
  culturalIntegration?: {
    koreanPopulationRate?: string;
    foreignResidentRatio?: string;
    koreanResourcesLinks?: string[];
  };
}
