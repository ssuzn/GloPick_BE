import json
import math
from pathlib import Path
from statistics import mean, pstdev

INDICATORS = ["income", "jobs", "health", "lifeSatisfaction", "safety"]

# 일단 기존 TS 코드의 lambda를 사용
# 나중에 scipy를 설치하면 최적 lambda 자동 산출 버전으로 개선 가능
BOX_COX_LAMBDAS = {
    "income": 0.5,
    "jobs": 1.0,
    "health": -0.5,
    "lifeSatisfaction": 1.0,
    "safety": 0.0,
}

ROOT_DIR = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT_DIR / "data" / "oecd_raw.json"
OUTPUT_PATH = ROOT_DIR / "data" / "oecd_processed.json"


def box_cox_transform(value: float, lambda_value: float) -> float:
    value = value + 1

    if lambda_value == 0:
        return math.log(value)

    return (math.pow(value, lambda_value) - 1) / lambda_value


def to_score(value: float, lambda_value: float, avg: float, std_dev: float) -> float:
    if std_dev == 0:
        return 50.0

    transformed = box_cox_transform(value, lambda_value)
    z_score = (transformed - avg) / std_dev
    score = z_score * 18 + 50

    return round(max(0, min(100, score)), 2)


def main():
    with open(RAW_PATH, "r", encoding="utf-8") as file:
        raw_data = json.load(file)

    statistics = {}

    for indicator in INDICATORS:
        transformed_values = [
            box_cox_transform(row[indicator], BOX_COX_LAMBDAS[indicator])
            for row in raw_data
            if row.get(indicator) is not None
        ]

        statistics[indicator] = {
            "lambda": BOX_COX_LAMBDAS[indicator],
            "mean": round(mean(transformed_values), 4),
            "stdDev": round(pstdev(transformed_values), 4),
        }

    normalized_data = []

    for row in raw_data:
        scores = {}

        for indicator in INDICATORS:
            stat = statistics[indicator]

            scores[indicator] = to_score(
                value=row[indicator],
                lambda_value=stat["lambda"],
                avg=stat["mean"],
                std_dev=stat["stdDev"],
            )

        normalized_data.append(
            {
                "country": row["country"],
                "countryCode": row["countryCode"],
                "rawValues": {
                    indicator: row[indicator] for indicator in INDICATORS
                },
                "scores": scores,
            }
        )

    result = {
        "metadata": {
            "source": "OECD Better Life Index",
            "method": "Box-Cox transform + Z-Score normalization",
            "scoreScale": "zScore * 18 + 50, clipped to 0-100",
            "countryCount": len(normalized_data),
        },
        "statistics": statistics,
        "normalizedData": normalized_data,
    }

    with open(OUTPUT_PATH, "w", encoding="utf-8") as file:
        json.dump(result, file, ensure_ascii=False, indent=2)

    print(f"✅ 전처리 완료: {OUTPUT_PATH}")
    print(f"✅ 국가 수: {len(normalized_data)}")


if __name__ == "__main__":
    main()