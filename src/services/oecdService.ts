import processedData from "../../data/oecd_processed.json";

type Indicator = "income" | "jobs" | "health" | "lifeSatisfaction" | "safety";

interface UserWeights {
  income: number;
  jobs: number;
  health: number;
  lifeSatisfaction: number;
  safety: number;
}

interface ProcessedCountryData {
  country: string;
  countryCode: string;
  rawValues: Record<Indicator, number>;
  scores: Record<Indicator, number>;
}

class OECDService {
  private readonly indicators: Indicator[] = [
    "income",
    "jobs",
    "health",
    "lifeSatisfaction",
    "safety",
  ];

  private readonly countryMapping: Record<string, string> = {
    한국: "KOR",
    일본: "JPN",
    미국: "USA",
    독일: "DEU",
  };

  private readonly englishCountryMapping: Record<string, string> = {
    Korea: "KOR",
    "South Korea": "KOR",
    Japan: "JPN",
    "United States": "USA",
    USA: "USA",
    US: "USA",
    Germany: "DEU",
  };

  private normalizeCountryName(countryName: string) {
    return countryName.trim().toLowerCase();
  }

  private findCountry(countryName: string): ProcessedCountryData | undefined {
    const normalizedName = this.normalizeCountryName(countryName);
    
    const countryCode =
      this.englishCountryMapping[countryName] ||
      this.countryMapping[countryName] ||
      countryName.toUpperCase();
    
    return processedData.normalizedData.find(
      (item) =>
        item.countryCode === countryCode ||
        this.normalizeCountryName(item.country) === normalizedName
    ) as ProcessedCountryData | undefined;
  }

  async getCountryBetterLifeData(countryName: string) {
    const country = this.findCountry(countryName);

    if (!country) return null;

    return {
      country: country.country,
      countryCode: country.countryCode,
      ...country.rawValues,
    };
  }

  async calculateQualityOfLifeScore(
    countryName: string,
    userWeights: UserWeights
  ): Promise<number> {
    const country = this.findCountry(countryName);

    if (!country) return 50;

    const finalScore =
      this.indicators.reduce((sum, key) => {
        return sum + country.scores[key] * userWeights[key];
      }, 0) / 100;

    return Math.round(Math.max(0, finalScore) * 100) / 100;
  }

  getCountryScores(countryName: string) {
    const country = this.findCountry(countryName);

    if (!country) return null;

    return {
      country: country.country,
      countryCode: country.countryCode,
      rawValues: country.rawValues,
      scores: country.scores,
    };
  }

  getPipelineMetadata() {
    return processedData.metadata;
  }

  getStatistics() {
    return processedData.statistics;
  }
}

export const oecdService = new OECDService();