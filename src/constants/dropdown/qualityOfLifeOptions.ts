// OECD Better Life Index 5가지 핵심 지표
export const QUALITY_OF_LIFE_INDICATORS = {
  income: {
    label: "소득 (Income)",
    description: "가구 순자산, 가구 순조정 가처분소득, 소득 분배 관련 지표",
    unit: "USD",
  },
  jobs: {
    label: "일자리 (Jobs)",
    description: "고용률, 장기실업률, 평균 연간 임금, 직업 안전성",
    unit: "%",
  },
  health: {
    label: "건강 (Health)",
    description: "기대수명, 건강상태 자가평가, 예방 가능 및 치료 가능 사망률",
    unit: "years/score",
  },
  lifeSatisfaction: {
    label: "삶의 만족도 (Life Satisfaction)",
    description: "삶의 만족도 평가 점수, 긍정적/부정적 경험 지표",
    unit: "0-10 scale",
  },
  safety: {
    label: "안전 (Safety)",
    description: "살인율, 야간 보행 안전 인식, 강도 피해율",
    unit: "%",
  },
} as const;