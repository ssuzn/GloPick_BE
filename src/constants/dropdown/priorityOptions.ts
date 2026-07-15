// 우선순위 옵션 (3가지: 언어, 직무, 삶의 질)
export const PRIORITY_OPTIONS = {
  language: {
    label: "언어 호환성",
    description: "사용 가능한 언어와 현지 언어의 일치도",
  },
  job: {
    label: "직무 기회",
    description: "해당 직무 분야의 취업 기회",
  },
  qualityOfLife: {
    label: "삶의 질",
    description: "OECD Better Life Index 기반 생활 여건",
  },
} as const;

export type PriorityOption = keyof typeof PRIORITY_OPTIONS;