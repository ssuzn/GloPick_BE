import processedData from "../../data/oecd_processed.json";

type Indicator = "income" | "jobs" | "health" | "lifeSatisfaction" | "safety";

interface UserWeights {
  income: number;
  jobs: number;
  health: number;
  lifeSatisfaction: number;
  safety: number;
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

  private findCountry(countryName: string) {
    const countryCode =
      this.englishCountryMapping[countryName] || this.countryMapping[countryName];

    return processedData.normalizedData.find(
      (item) =>
        item.country === countryName ||
        item.countryCode === countryName ||
        item.countryCode === countryCode ||
        item.country.toLowerCase() === countryName.toLowerCase()
    );
  }

  async getCountryBetterLifeData(countryName: string) {
  const country = this.findCountry(countryName);
  if (!country) {
    return null;
  }

  return {
    country: country.country,
    countryCode: country.countryCode,
    income: country.rawValues.income,
    jobs: country.rawValues.jobs,
    health: country.rawValues.health,
    lifeSatisfaction: country.rawValues.lifeSatisfaction,
    safety: country.rawValues.safety,
  };
}

  async calculateQualityOfLifeScore(
    countryName: string,
    userWeights: UserWeights
  ): Promise<number> {
    const country = this.findCountry(countryName);

    if (!country) {
      return 50;
    }

    const finalScore =
      this.indicators.reduce((sum, key) => {
        return sum + country.scores[key] * userWeights[key];
      }, 0) / 100;

    return Math.round(Math.max(0, finalScore) * 100) / 100;
  }

  getProcessedMetadata() {
    return processedData.metadata;
  }

  getProcessedStatistics() {
    return processedData.statistics;
  }

  getCountryScores(countryName: string) {
    const country = this.findCountry(countryName);

    if (!country) {
      return null;
    }

    return {
      country: country.country,
      countryCode: country.countryCode,
      rawValues: country.rawValues,
      scores: country.scores,
    };
  }
}

export const oecdService = new OECDService();