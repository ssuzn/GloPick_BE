import { SimulationResult, SimulationInput } from "../generated/prisma/client";

type SimulationResultWithInput = SimulationResult & {
  input: SimulationInput | null;
};

export class MyPageSimulationMapper {
  static toResponse(sim: SimulationResultWithInput) {
    return {
      id: sim.id,
      input: sim.input
        ? {
            inputId: sim.input.id,
            selectedCountry: sim.input.selectedCountry,
            selectedCity: sim.input.selectedCity,
            initialBudget: sim.input.initialBudget,
            requiredFacilities: sim.input.requiredFacilities,
            departureAirport: sim.input.departureAirport,
            recommendedCities: sim.input.recommendedCities,
          }
        : null,
      country: sim.country,
      result: {
        recommendedCity: sim.recommendedCity,
        localInfo: {
          essentialFacilities: sim.essentialFacilities,
          publicTransport: sim.publicTransport,
          safetyLevel: sim.safetyLevel,
          climateSummary: sim.climateSummary,
          koreanCommunity: sim.koreanCommunity,
          culturalTips: sim.culturalTips,
          warnings: sim.warnings,
        },
        estimatedMonthlyCost: {
          housing: sim.housing,
          food: sim.food,
          transportation: sim.transportation,
          etc: sim.etc,
          total: sim.total,
          oneYearCost: sim.oneYearCost,
          costCuttingTips: sim.costCuttingTips,
          cpi: sim.cpi,
        },
        initialSetup: {
          shortTermHousingOptions: sim.shortTermHousingOptions,
          longTermHousingPlatforms: sim.longTermHousingPlatforms,
          mobilePlan: sim.mobilePlan,
          bankAccount: sim.bankAccount,
        },
        jobReality: {
          jobSearchPlatforms: sim.jobSearchPlatforms,
          languageRequirement: sim.languageRequirement,
          visaLimitationTips: sim.visaLimitationTips,
        },
        culturalIntegration: {
          koreanPopulationRate: sim.koreanPopulationRate,
          foreignResidentRatio: sim.foreignResidentRatio,
          koreanResourcesLinks: sim.koreanResourcesLinks,
        },
        facilityLocations: sim.facilityLocations,
      },
      createdAt: sim.createdAt,
    };
  }
}