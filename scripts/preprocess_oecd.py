import argparse
import json
import logging
from pathlib import Path
from datetime import datetime

import numpy as np
import pandas as pd
from scipy import stats

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s | %(message)s"
)

INDICATORS = ["income", "jobs", "health", "lifeSatisfaction", "safety"]

ROOT_DIR = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT_DIR / "data" / "raw" / "oecd_bli_raw.csv"
OUTPUT_PATH = ROOT_DIR / "data" / "oecd_processed.json"


def clip_outliers(series: pd.Series) -> pd.Series:
    """5~95 분위수 기준으로 극단값 완화"""
    lower = series.quantile(0.05)
    upper = series.quantile(0.95)
    return series.clip(lower, upper)


def fill_missing_values(df: pd.DataFrame) -> pd.DataFrame:
    """결측치는 지표별 중앙값으로 보완"""
    for indicator in INDICATORS:
        median_value = df[indicator].median()
        df[indicator] = df[indicator].fillna(median_value)
    return df


def boxcox_transform(series: pd.Series):
    """
    Box-Cox 변환 및 lambda 자동 계산.
    데이터 수가 적을 때 lambda가 과도하게 튀는 것을 방지하기 위해 -2~2 범위로 제한.
    """
    values = series.astype(float) + 1
    transformed, lambda_value = stats.boxcox(values)
    lambda_value = float(np.clip(lambda_value, -2, 2))
    if lambda_value == 0:
        transformed = np.log(values)
    else:
        transformed = ((values ** lambda_value) - 1) / lambda_value
    return transformed, lambda_value


def to_0_100_score(z_scores: np.ndarray) -> np.ndarray:
    """Z-Score를 0~100 점수로 변환"""
    scores = z_scores * 18 + 50
    return np.clip(scores, 0, 100)

def validate_input_data(df: pd.DataFrame) -> None:
    required_columns = ["country", "countryCode", *INDICATORS]

    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise ValueError(f"필수 컬럼 누락: {missing_columns}")

    for indicator in INDICATORS:
        if (df[indicator] < 0).any():
            raise ValueError(f"{indicator} 컬럼에 음수 값이 있습니다.")

        if (df[indicator] > 100).any():
            raise ValueError(f"{indicator} 컬럼에 비정상적으로 큰 값이 있습니다.")
          
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

    logging.info(f"입력 파일 로드: {input_path}")

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

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(result, file, ensure_ascii=False, indent=2)

    logging.info(f"✅ 전처리 완료: {output_path}")
    logging.info(f"✅ 국가 수: {len(normalized_data)}")


if __name__ == "__main__":
    main()