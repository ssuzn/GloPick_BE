import pandas as pd

from preprocessing.cleaner import clip_outliers, fill_missing_values

def test_fill_missing_values():
    df = pd.DataFrame({
        "country": ["한국", "일본", "미국"],
        "countryCode": ["KOR", "JPN", "USA"],
        "income": [5.8, None, 8.1],
        "jobs": [6.4, 7.1, None],
        "health": [8.8, 9.1, 7.8],
        "lifeSatisfaction": [5.8, None, 6.9],
        "safety": [8.8, 9.4, 7.1],
    })

    result = fill_missing_values(df)

    assert result["income"].isna().sum() == 0
    assert result["jobs"].isna().sum() == 0
    assert result["lifeSatisfaction"].isna().sum() == 0


def test_clip_outliers():
    series = pd.Series([10, 11, 12, 13, 1000])

    result = clip_outliers(series)

    assert result.max() < 1000
    assert result.min() >= 10