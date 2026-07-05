import numpy as np
import pandas as pd
from scipy import stats

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

def calculate_statistics(series: pd.Series) -> dict:
    return {
        "mean": round(series.mean(), 4),
        "median": round(series.median(), 4),
        "stdDev": round(series.std(), 4),
        "variance": round(series.var(), 4),
        "min": round(series.min(), 4),
        "q1": round(series.quantile(0.25), 4),
        "q3": round(series.quantile(0.75), 4),
        "iqr": round(series.quantile(0.75) - series.quantile(0.25), 4),
        "max": round(series.max(), 4),
    }