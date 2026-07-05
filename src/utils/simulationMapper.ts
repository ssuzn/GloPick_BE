export const createSimulationResultData = (
  gptResult: any,
  facilityLocations: any
) => {
  return {
    recommendedCity: gptResult.recommendedCity ?? null,

    essentialFacilities: gptResult.localInfo?.essentialFacilities ?? [],
    publicTransport: gptResult.localInfo?.publicTransport ?? null,
    safetyLevel: gptResult.localInfo?.safetyLevel ?? null,
    climateSummary: gptResult.localInfo?.climateSummary ?? null,
    koreanCommunity: gptResult.localInfo?.koreanCommunity ?? null,
    culturalTips: gptResult.localInfo?.culturalTips ?? null,
    warnings: gptResult.localInfo?.warnings ?? null,

    facilityLocations,

    housing: gptResult.estimatedMonthlyCost?.housing ?? null,
    food: gptResult.estimatedMonthlyCost?.food ?? null,
    transportation: gptResult.estimatedMonthlyCost?.transportation ?? null,
    etc: gptResult.estimatedMonthlyCost?.etc ?? null,
    total: gptResult.estimatedMonthlyCost?.total ?? null,
    oneYearCost: gptResult.estimatedMonthlyCost?.oneYearCost ?? null,
    costCuttingTips: gptResult.estimatedMonthlyCost?.costCuttingTips ?? null,
    cpi: gptResult.estimatedMonthlyCost?.cpi ?? null,

    shortTermHousingOptions:
      gptResult.initialSetup?.shortTermHousingOptions ?? [],
    longTermHousingPlatforms:
      gptResult.initialSetup?.longTermHousingPlatforms ?? [],
    mobilePlan: gptResult.initialSetup?.mobilePlan ?? null,
    bankAccount: gptResult.initialSetup?.bankAccount ?? null,

    jobSearchPlatforms: gptResult.jobReality?.jobSearchPlatforms ?? [],
    languageRequirement: gptResult.jobReality?.languageRequirement ?? null,
    visaLimitationTips: gptResult.jobReality?.visaLimitationTips ?? null,

    koreanPopulationRate:
      gptResult.culturalIntegration?.koreanPopulationRate ?? null,
    foreignResidentRatio:
      gptResult.culturalIntegration?.foreignResidentRatio ?? null,
    koreanResourcesLinks:
      gptResult.culturalIntegration?.koreanResourcesLinks ?? [],
  };
};

export const formatSimulationResult = (simulation: any) => {
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