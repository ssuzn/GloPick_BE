import { prisma } from "../../db";
import {
  GenerateSimulationResultParams,
  GPTSimulationResponse,
} from "../../types/simulation";
import { createFlightLinks } from "../../utils/flightLinkGenerator";
import { generateSimulationResponse } from "../gptSimulationService";
import { searchFacilities } from "../googleMapsService";
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
    gptResult: GPTSimulationResponse,
    facilityLocations: any = {},
  ) {
    return prisma.simulationResult.create({
      data: {
        userId,
        inputId,
        country: selectedCountry,
        ...SimulationMapper.toEntity(gptResult, facilityLocations),
      },
    });
  }

  static async generateSimulationResult({
    input,
    userId,
    departureAirport,
    selectedCity,
  }: GenerateSimulationResultParams) {
    const gptResult = await generateSimulationResponse(input);

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

    const saved = await this.createSimulationResult(
      userId,
      input.id,
      input.selectedCountry,
      gptResult,
      facilityLocations,
    );

    return {
      simulationId: saved.id,
      result: SimulationMapper.toResponse(saved),
      flightLinks,
    };
  }
}
