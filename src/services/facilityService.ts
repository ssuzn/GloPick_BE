import { REQUIRED_FACILITIES } from "../constants/dropdownOptions";

/**
 * 시설의 최대 검색 개수 가져오기
 */
export const getFacilityMaxResults = (facilityValue: string): number => {
  const facility = REQUIRED_FACILITIES.find((f) => f.value === facilityValue);
  return facility?.maxResults || 5;
};

/**
 * 시설 value로 label 가져오기
 */
export const getFacilityLabel = (facilityValue: string): string => {
  const facility = REQUIRED_FACILITIES.find((f) => f.value === facilityValue);
  return facility?.label || facilityValue;
};