import pandas as pd

from preprocessing.config import INDICATORS

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