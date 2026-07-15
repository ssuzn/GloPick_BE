import { Prisma, SimulationResult } from "../generated/prisma/client";
import { SimulationGenerationResponse } from "../types/simulation";
import { FacilityLocation } from "../services/googleMapsService";

export class SimulationMapper {
  static toEntity (
    generatedSimulation: SimulationGenerationResponse,
    facilityLocations: Record<string, FacilityLocation[]> = {},
  ) {
    return {
      recommendedCity: generatedSimulation.recommendedCity ?? null,

      essentialFacilities:
        generatedSimulation.localInfo?.essentialFacilities ?? [],
      publicTransport: generatedSimulation.localInfo?.publicTransport ?? null,
      safetyLevel: generatedSimulation.localInfo?.safetyLevel ?? null,
      climateSummary: generatedSimulation.localInfo?.climateSummary ?? null,
      koreanCommunity: generatedSimulation.localInfo?.koreanCommunity ?? null,
      culturalTips: generatedSimulation.localInfo?.culturalTips ?? null,
      warnings: generatedSimulation.localInfo?.warnings ?? null,

      facilityLocations,

      housing: generatedSimulation.estimatedMonthlyCost?.housing ?? null,
      food: generatedSimulation.estimatedMonthlyCost?.food ?? null,
      transportation:
        generatedSimulation.estimatedMonthlyCost?.transportation ?? null,
      etc: generatedSimulation.estimatedMonthlyCost?.etc ?? null,
      total: generatedSimulation.estimatedMonthlyCost?.total ?? null,
      oneYearCost:
        generatedSimulation.estimatedMonthlyCost?.oneYearCost ?? null,
      costCuttingTips:
        generatedSimulation.estimatedMonthlyCost?.costCuttingTips ?? null,
      cpi: generatedSimulation.estimatedMonthlyCost?.cpi ?? null,

      shortTermHousingOptions:
        generatedSimulation.initialSetup?.shortTermHousingOptions ?? [],
      longTermHousingPlatforms:
        generatedSimulation.initialSetup?.longTermHousingPlatforms ?? [],
      mobilePlan: generatedSimulation.initialSetup?.mobilePlan ?? null,
      bankAccount: generatedSimulation.initialSetup?.bankAccount ?? null,

      jobSearchPlatforms:
        generatedSimulation.jobReality?.jobSearchPlatforms ?? [],
      languageRequirement:
        generatedSimulation.jobReality?.languageRequirement ?? null,
      visaLimitationTips:
        generatedSimulation.jobReality?.visaLimitationTips ?? null,

      koreanPopulationRate:
        generatedSimulation.culturalIntegration?.koreanPopulationRate ?? null,
      foreignResidentRatio:
        generatedSimulation.culturalIntegration?.foreignResidentRatio ?? null,
      koreanResourcesLinks:
        generatedSimulation.culturalIntegration?.koreanResourcesLinks ?? [],
    };
  }

  static toResponse (simulation: Prisma.SimulationResultModel) {
    return {
      country: simulation.country,
      recommendedCity: simulation.recommendedCity,
      localInfo: {
        essentialFacilities: simulation.essentialFacilities,
        publicTransport: simulation.publicTransport,
        safetyLevel: simulation.safetyLevel,
        climateSummary: simulation.climateSummary,
        koreanCommunity: simulation.koreanCommunity,
        culturalTips: simulation.culturalTips,
        warnings: simulation.warnings,
      },
      facilityLocations: simulation.facilityLocations,
      estimatedMonthlyCost: {
        housing: simulation.housing,
        food: simulation.food,
        transportation: simulation.transportation,
        etc: simulation.etc,
        total: simulation.total,
        oneYearCost: simulation.oneYearCost,
        costCuttingTips: simulation.costCuttingTips,
        cpi: simulation.cpi,
      },
      initialSetup: {
        shortTermHousingOptions: simulation.shortTermHousingOptions,
        longTermHousingPlatforms: simulation.longTermHousingPlatforms,
        mobilePlan: simulation.mobilePlan,
        bankAccount: simulation.bankAccount,
      },
      jobReality: {
        jobSearchPlatforms: simulation.jobSearchPlatforms,
        languageRequirement: simulation.languageRequirement,
        visaLimitationTips: simulation.visaLimitationTips,
      },
      culturalIntegration: {
        koreanPopulationRate: simulation.koreanPopulationRate,
        foreignResidentRatio: simulation.foreignResidentRatio,
        koreanResourcesLinks: simulation.koreanResourcesLinks,
      },
    };
  };
}
