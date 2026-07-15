import { prisma } from "../../db";
import {
  GenerateSimulationResultParams,
  SimulationGenerationResponse,
} from "../../types/simulation";
import { createFlightLinks } from "../../utils/flightLinkGenerator";
import { generateSimulationResponse } from "../geminiSimulationService";
import {
  FacilityLocation,
  searchFacilities,
} from "../googleMapsService";
import { SimulationMapper } from "../../mappers/simulationMapper";

export class SimulationResultService {
  static async findSimulationResult(inputId: number, userId: number) {
    return prisma.simulationResult.findFirst({
      where: {
        inputId,
        userId,
      },
    });
  }

  static async createSimulationResult(
    userId: number,
    inputId: number,
    selectedCountry: string,
    generatedSimulation: SimulationGenerationResponse,
    facilityLocations: Record<string, FacilityLocation[]> = {},
  ) {
    return prisma.simulationResult.create({
      data: {
        userId,
        inputId,
        country: selectedCountry,
        ...SimulationMapper.toEntity(generatedSimulation, facilityLocations),
      },
    });
  }

  static async generateSimulationResult({
    input,
    userId,
    departureAirport,
    selectedCity,
  }: GenerateSimulationResultParams) {
    const generatedSimulation = await generateSimulationResponse(input);

    const arrivalAirportCode =
      generatedSimulation.nearestAirport?.code || selectedCity;
    const flightLinks = createFlightLinks(departureAirport, arrivalAirportCode);

    let facilityLocations: Record<string, FacilityLocation[]> = {};

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

    const saved = await this.createSimulationResult(
      userId,
      input.id,
      input.selectedCountry,
      generatedSimulation,
      facilityLocations,
    );

    return {
      simulationId: saved.id,
      result: SimulationMapper.toResponse(saved),
      flightLinks,
    };
  }
}
