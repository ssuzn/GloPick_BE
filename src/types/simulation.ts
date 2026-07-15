import {
  DepartureAirport,
  InitialBudget,
  SimulationInput,
} from "../generated/prisma/client";
import type { GeminiSimulation } from "../schemas/geminiSimulation.schema";

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

export type SimulationGenerationResponse = GeminiSimulation & {
  nearestAirport?: {
    code?: string;
    name?: string;
  };
};
