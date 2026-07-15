// 필수 편의시설 옵션 (최대 5개 선택 가능)
export const REQUIRED_FACILITIES = [
  // 의료 시설
  { category: "medical", value: "hospital", label: "종합병원", maxResults: 5 },
  { category: "medical", value: "clinic", label: "병의원", maxResults: 5 },
  { category: "medical", value: "pharmacy", label: "약국", maxResults: 5 },

  // 교육 시설
  {
    category: "education",
    value: "elementary_school",
    label: "초등학교",
    maxResults: 5,
  },
  {
    category: "education",
    value: "middle_school",
    label: "중학교",
    maxResults: 5,
  },
  {
    category: "education",
    value: "high_school",
    label: "고등학교",
    maxResults: 5,
  },
  {
    category: "education",
    value: "university",
    label: "대학교",
    maxResults: 3,
  },

  // 교통 시설
  {
    category: "transportation",
    value: "subway_station",
    label: "지하철",
    maxResults: 5,
  },
  {
    category: "transportation",
    value: "train_station",
    label: "기차역",
    maxResults: 3,
  },
  {
    category: "transportation",
    value: "airport",
    label: "공항",
    maxResults: 1,
  },

  // 생활 편의시설
  {
    category: "living",
    value: "supermarket",
    label: "대형마트",
    maxResults: 5,
  },
  {
    category: "living",
    value: "convenience_store",
    label: "편의점",
    maxResults: 5,
  },
  {
    category: "living",
    value: "korean_grocery",
    label: "한인마트",
    maxResults: 5,
  },
  {
    category: "living",
    value: "korean_restaurant",
    label: "한식당",
    maxResults: 5,
  },

  // 공공/행정 시설
  {
    category: "public",
    value: "korean_embassy",
    label: "한국 대사관/영사관",
    maxResults: 1,
  },
  { category: "public", value: "bank", label: "은행", maxResults: 5 },
  {
    category: "public",
    value: "police_station",
    label: "경찰서",
    maxResults: 3,
  },

  // 문화/여가 시설
  { category: "leisure", value: "park", label: "공원", maxResults: 5 },
  { category: "leisure", value: "library", label: "도서관", maxResults: 5 },
  {
    category: "leisure",
    value: "movie_theater",
    label: "영화관",
    maxResults: 5,
  },
  {
    category: "leisure",
    value: "shopping_mall",
    label: "쇼핑몰",
    maxResults: 3,
  },
  {
    category: "leisure",
    value: "tourist_attraction",
    label: "랜드마크/명소",
    maxResults: 1,
  },

  // 종교 시설
  { category: "religious", value: "church", label: "교회", maxResults: 5 },
  { category: "religious", value: "temple", label: "절/사찰", maxResults: 5 },
] as const;

// 카테고리별 편의시설 그룹
export const FACILITIES_BY_CATEGORY = {
  medical: {
    label: "의료 시설",
    facilities: REQUIRED_FACILITIES.filter((f) => f.category === "medical"),
  },
  education: {
    label: "교육 시설",
    facilities: REQUIRED_FACILITIES.filter((f) => f.category === "education"),
  },
  transportation: {
    label: "교통 시설",
    facilities: REQUIRED_FACILITIES.filter(
      (f) => f.category === "transportation"
    ),
  },
  living: {
    label: "생활 편의시설",
    facilities: REQUIRED_FACILITIES.filter((f) => f.category === "living"),
  },
  public: {
    label: "공공/행정 시설",
    facilities: REQUIRED_FACILITIES.filter((f) => f.category === "public"),
  },
  leisure: {
    label: "문화/여가 시설",
    facilities: REQUIRED_FACILITIES.filter((f) => f.category === "leisure"),
  },
  religious: {
    label: "종교 시설",
    facilities: REQUIRED_FACILITIES.filter((f) => f.category === "religious"),
  },
} as const;

// 시설의 최대 검색 개수 가져오기
export const getFacilityMaxResults = (facilityValue: string): number => {
  const facility = REQUIRED_FACILITIES.find((f) => f.value === facilityValue);
  return facility?.maxResults || 5;
};

// 시설 value로 label 가져오기
export const getFacilityLabel = (facilityValue: string): string => {
  const facility = REQUIRED_FACILITIES.find((f) => f.value === facilityValue);
  return facility?.label || facilityValue;
};

export type FacilityValue = (typeof REQUIRED_FACILITIES)[number]["value"];
export type FacilityCategory = (typeof REQUIRED_FACILITIES)[number]["category"];