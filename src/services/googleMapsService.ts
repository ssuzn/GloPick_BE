import { Client } from "@googlemaps/google-maps-services-js";
import {
  getFacilityMaxResults,
  getFacilityLabel,
} from "../constants/dropdownOptions";

const client = new Client({});

export type FacilityLocation = {
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  placeId: string;
  rating?: number;
  types?: string[];
};

/**
 * Google Maps Places API를 사용하여 특정 도시에서 편의시설을 검색
 * @param city 검색할 도시명
 * @param country 국가명
 * @param facilities 검색할 편의시설 목록 (배열)
 * @returns 편의시설별 위치 정보 객체
 */
export const searchFacilities = async (
  city: string,
  country: string,
  facilities: string[]
): Promise<Record<string, FacilityLocation[]>> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.");
    throw new Error("Google Maps API 키가 설정되지 않았습니다.");
  }

  const results: Record<string, FacilityLocation[]> = {};

  for (const facilityValue of facilities) {
    try {
      // 시설별 최대 검색 개수
      const maxResults = getFacilityMaxResults(facilityValue);
      const facilityLabel = getFacilityLabel(facilityValue);

      console.log(
        `🔍 검색 중: ${facilityLabel} (${facilityValue}) in ${city}, ${country} (최대 ${maxResults}개)`
      );

      const response = await client.textSearch({
        params: {
          query: `${facilityLabel} in ${city}, ${country}`,
          key: apiKey,
          language: "ko" as any,
        },
      });

      const locations = response.data.results
        .slice(0, maxResults)
        .map((place) => ({
          name: place.name || "Unknown",
          address: place.formatted_address || "",
          location: {
            lat: place.geometry?.location.lat || 0,
            lng: place.geometry?.location.lng || 0,
          },
          placeId: place.place_id || "",
          rating: place.rating,
          types: place.types as string[] | undefined,
        }));

      // 시설이 발견된 경우만 결과에 포함
      if (locations.length > 0) {
        results[facilityValue] = locations;
        console.log(`✅ ${facilityLabel}: ${locations.length}개 발견`);
      } else {
        console.warn(
          `⚠️ ${city}에서 ${facilityLabel}을(를) 찾을 수 없습니다. (지도에 표시하지 않음)`
        );
      }
    } catch (error) {
      console.error(`❌ ${facilityValue} 검색 실패:`, error);
      // 에러 발생 시 해당 시설은 결과에 포함하지 않음
    }
  }

  return results;
};

/**
 * Place ID를 사용하여 특정 장소의 상세 정보 조회
 * @param placeId Google Maps Place ID
 * @returns 장소 상세 정보
 */
export const getPlaceDetails = async (placeId: string) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API 키가 설정되지 않았습니다.");
  }

  try {
    const response = await client.placeDetails({
      params: {
        place_id: placeId,
        key: apiKey,
        language: "ko" as any,
        fields: [
          "name",
          "formatted_address",
          "geometry",
          "rating",
          "opening_hours",
          "photos",
          "formatted_phone_number",
          "website",
        ],
      },
    });

    return response.data.result;
  } catch (error) {
    console.error("Error fetching place details:", error);
    throw error;
  }
};

/**
 * 도시의 중심 좌표를 검색
 * @param city 도시명
 * @param country 국가명
 * @returns 도시의 중심 좌표 (lat, lng)
 */
export const getCityCenter = async (
  city: string,
  country: string
): Promise<{ lat: number; lng: number }> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API 키가 설정되지 않았습니다.");
  }

  try {
    const response = await client.geocode({
      params: {
        address: `${city}, ${country}`,
        key: apiKey,
      },
    });

    const location = response.data.results[0]?.geometry?.location;

    if (!location) {
      throw new Error("도시 좌표를 찾을 수 없습니다.");
    }

    return {
      lat: location.lat,
      lng: location.lng,
    };
  } catch (error) {
    console.error(`Error getting center for ${city}:`, error);
    throw error;
  }
};
