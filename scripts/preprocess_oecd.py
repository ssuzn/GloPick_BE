import argparse
import json

from preprocessing.exporter import export_processed_json
from preprocessing.transformer import boxcox_transform, to_0_100_score
from preprocessing.cleaner import clip_outliers, fill_missing_values
from preprocessing.logger import logger
from preprocessing.validator import validate_input_data
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
from scipy import stats

INDICATORS = ["income", "jobs", "health", "lifeSatisfaction", "safety"]

ROOT_DIR = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT_DIR / "data" / "raw" / "oecd_bli_raw.csv"
OUTPUT_PATH = ROOT_DIR / "data" / "oecd_processed.json"


def parse_args():
    parser = argparse.ArgumentParser(description="OECD BLI 데이터 전처리")
    parser.add_argument(
        "--input",
        default=str(ROOT_DIR / "data" / "raw" / "oecd_bli_raw.csv"),
        help="입력 CSV 경로",
    )
    parser.add_argument(
        "--output",
        default=str(ROOT_DIR / "data" / "oecd_processed.json"),
        help="출력 JSON 경로",
    )
    return parser.parse_args()
  
def main():
    args = parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)

    logger.info(f"입력 파일 로드: {input_path}")

    df = pd.read_csv(input_path)
    validate_input_data(df)

    # 1. 결측치 처리
    df = fill_missing_values(df)

    statistics_result = {}
    score_columns = {}

    for indicator in INDICATORS:

        # 2. 이상치 완화
        clipped = clip_outliers(df[indicator])

        # 3. Box-Cox 변환 + lambda 자동 산출
        transformed, lambda_value = boxcox_transform(clipped)

        # 4. Z-Score 계산
        mean_value = float(np.mean(transformed))
        std_value = float(np.std(transformed))

        if std_value == 0:
            z_scores = np.zeros_like(transformed)
        else:
            z_scores = (transformed - mean_value) / std_value

        # 5. 0~100 점수 변환
        scores = to_0_100_score(z_scores)

        score_columns[indicator] = np.round(scores, 2)

        statistics_result[indicator] = {
            "lambda": round(lambda_value, 4),
            "mean": round(mean_value, 4),
            "stdDev": round(std_value, 4),
            "min": round(float(clipped.min()), 4),
            "max": round(float(clipped.max()), 4),
        }

    normalized_data = []

    for index, row in df.iterrows():
        normalized_data.append(
            {
                "country": row["country"],
                "countryCode": row["countryCode"],
                "rawValues": {
                    indicator: float(row[indicator]) for indicator in INDICATORS
                },
                "scores": {
                    indicator: float(score_columns[indicator][index])
                    for indicator in INDICATORS
                },
            }
        )

    result = {
        "metadata": {
            "source": "OECD Better Life Index",
            "method": "missing value median imputation + percentile clipping + Box-Cox + Z-Score normalization",
            "scoreScale": "zScore * 18 + 50, clipped to 0-100",
            "countryCount": len(normalized_data),
            "createdAt": datetime.now().isoformat(timespec="seconds"),
        },
        "statistics": statistics_result,
        "normalizedData": normalized_data,
    }

    export_processed_json(result, output_path)
    logger.info(f"국가 수: {len(normalized_data)}")


if __name__ == "__main__":
    main()