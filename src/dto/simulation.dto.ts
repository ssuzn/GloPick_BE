export interface RecommendCitiesRequestDto {
  selectedCountryIndex: number;
}

export interface SaveSimulationRequestDto {
  selectedCityIndex: number;
  initialBudget: string;
  requiredFacilities: string[];
  departureAirport: string;
}