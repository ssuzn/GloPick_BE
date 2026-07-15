import { z } from "zod";

const nullableTextSchema = z.string().min(1).nullable();
const serviceListSchema = z.array(z.string().min(1));

export const geminiSimulationSchema = z
  .object({
    recommendedCity: z.string().min(1),
    localInfo: z
      .object({
        essentialFacilities: z.array(z.string().min(1)),
        publicTransport: nullableTextSchema,
        safetyLevel: nullableTextSchema,
        climateSummary: nullableTextSchema,
        koreanCommunity: nullableTextSchema,
        culturalTips: nullableTextSchema,
        warnings: nullableTextSchema,
      })
      .strict(),
    estimatedMonthlyCost: z
      .object({
        housing: nullableTextSchema,
        food: nullableTextSchema,
        transportation: nullableTextSchema,
        etc: nullableTextSchema,
        total: nullableTextSchema,
        oneYearCost: nullableTextSchema,
        costCuttingTips: nullableTextSchema,
        cpi: nullableTextSchema,
      })
      .strict(),
    initialSetup: z
      .object({
        shortTermHousingOptions: serviceListSchema,
        longTermHousingPlatforms: serviceListSchema,
        mobilePlan: nullableTextSchema,
        bankAccount: nullableTextSchema,
      })
      .strict(),
    jobReality: z
      .object({
        jobSearchPlatforms: serviceListSchema,
        languageRequirement: nullableTextSchema,
        visaLimitationTips: nullableTextSchema,
      })
      .strict(),
    culturalIntegration: z
      .object({
        koreanPopulationRate: nullableTextSchema,
        foreignResidentRatio: nullableTextSchema,
        koreanResourcesLinks: z.array(z.url()),
      })
      .strict(),
  })
  .strict();

export const geminiSimulationResponseSchema = z
  .object({
    simulation: geminiSimulationSchema,
  })
  .strict();

const unsupportedGeminiSchemaKeywords = new Set([
  "$schema",
  "minLength",
  "pattern",
]);

const removeUnsupportedSchemaKeywords = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(removeUnsupportedSchemaKeywords);
  }

  if (typeof value !== "object" || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !unsupportedGeminiSchemaKeywords.has(key))
      .map(([key, childValue]) => [
        key,
        removeUnsupportedSchemaKeywords(childValue),
      ]),
  );
};

const geminiSimulationJsonSchema = removeUnsupportedSchemaKeywords(
  z.toJSONSchema(geminiSimulationResponseSchema),
);

export const geminiSimulationResponseJsonSchema = geminiSimulationJsonSchema;

export type GeminiSimulation = z.infer<typeof geminiSimulationSchema>;
