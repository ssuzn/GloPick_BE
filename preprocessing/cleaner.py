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
  
def convert_long_to_wide(df: pd.DataFrame) -> pd.DataFrame:
    """
    Long Format:
    country,countryCode,indicator,value
    ↓
    Wide Format:
    country,countryCode,income,jobs,...
    """

    required = {"country", "countryCode", "indicator", "value"}
    if not required.issubset(df.columns):
        return df
    df = (
        df.pivot(
            index=["country", "countryCode"],
            columns="indicator",
            values="value",
        )
        .reset_index()
    )
    return df