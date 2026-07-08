// 직무 분야 목록 (ILOSTAT ISCO-08 대분류 기준)
export const JOB_FIELDS = [
  {
    code: "0",
    nameKo: "군인",
    nameEn: "Armed Forces Occupations",
    description:
      "사관 / 하사관 / 장교 / 부사관 / 병사 / ROTC / 군무원 등 국방 및 군사 관련 직무",
  },
  {
    code: "1",
    nameKo: "관리자",
    nameEn: "Managers",
    description:
      "CEO, 부장, 팀장, 공공기관 관리자, 스타트업 대표, 매니저, 공무원 간부, 정치인 등 조직의 운영·관리·의사결정 책임자",
  },
  {
    code: "2",
    nameKo: "전문가",
    nameEn: "Professionals",
    description:
      "과학·공학(연구원, 데이터 사이언티스트, AI 엔지니어, 소프트웨어 개발자 등), 보건(의사, 간호사, 약사 등), 교육(교수, 교사), 경영·금융(회계사, 경영컨설턴트), 법률·문화(변호사, 디자이너, 작가 등) 등 고숙련 전문직",
  },
  {
    code: "3",
    nameKo: "기술자 및 준전문가",
    nameEn: "Technicians and Associate Professionals",
    description:
      "CAD 기술자, 전산실 기술자, 임상시험코디네이터, 간호조무사, 방송기술자, IT 지원 기술자 등 전문가를 보조하거나 특정 기술을 수행하는 준전문직",
  },
  {
    code: "4",
    nameKo: "사무 종사자",
    nameEn: "Clerical Support Workers",
    description:
      "사무보조, 회계사무원, 인사·총무, 비서, 마케팅 사무원, 콜센터 상담원 등 사무 행정 및 지원 업무",
  },
  {
    code: "6",
    nameKo: "서비스 및 판매 종사자",
    nameEn: "Service and Sales Workers",
    description:
      "요리사, 바리스타, 미용사, 간병인, 호텔리어, 승무원, 판매원, 카페 매니저 등 고객대면 서비스 및 판매 관련 직무",
  },
  {
    code: "7",
    nameKo: "농림어업 숙련 종사자",
    nameEn: "Skilled Agricultural, Forestry and Fishery Workers",
    description:
      "농부, 과수농, 축산농, 임업인, 어부, 양식업 종사자, 조경사, 원예사 등 농림어업 및 원예·조경 분야 숙련 종사자",
  },
  {
    code: "8",
    nameKo: "기능원 및 관련 기능 종사자",
    nameEn: "Craft and Related Trades Workers",
    description:
      "건설 기능공, 목수, 배관공, 용접공, 자동차 정비사, 전기기사, 전자기기 수리공 등 현장 기반의 숙련 기능직",
  },
  {
    code: "9",
    nameKo: "설비·기계 조작 및 운전 종사자",
    nameEn: "Plant and Machine Operators and Drivers",
    description:
      "지게차·버스·트럭 운전기사, 크레인 기사, 생산기계 조작원, 반도체 장비 조작원 등 기계·설비 운전 및 조작 직무",
  },
  {
    code: "10",
    nameKo: "단순노무 종사자",
    nameEn: "Elementary Occupations",
    description:
      "청소원, 환경미화원, 경비원, 택배 상하차원, 음식 배달원, 주방보조, 건설현장 인부 등 단순 반복 작업 중심 직무",
  },
] as const;

export type JobFieldCode = (typeof JOB_FIELDS)[number]["code"];