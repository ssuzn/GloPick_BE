import numpy as np
import pandas as pd

from preprocessing.transformer import (
    boxcox_transform,
    calculate_statistics,
    to_0_100_score,
)

def test_boxcox_transform():
    series = pd.Series([5.8, 6.2, 6.9, 8.1])

    transformed, lambda_value = boxcox_transform(series)

    assert len(transformed) == 4
    assert isinstance(lambda_value, float)
    assert -2 <= lambda_value <= 2


def test_to_0_100_score():
    z_scores = np.array([-3, 0, 3])

    scores = to_0_100_score(z_scores)

    assert len(scores) == 3
    assert scores.min() >= 0
    assert scores.max() <= 100
    assert scores[1] == 50


def test_calculate_statistics():
    series = pd.Series([10, 20, 30, 40])

    result = calculate_statistics(series)

    assert result["mean"] == 25
    assert result["median"] == 25
    assert result["min"] == 10
    assert result["max"] == 40
    assert "iqr" in result