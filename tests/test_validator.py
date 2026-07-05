import pandas as pd
import pytest

from preprocessing.validator import validate_input_data

def test_validate_success():
    df = pd.DataFrame({
        "country": ["한국"],
        "countryCode": ["KOR"],
        "income": [6],
        "jobs": [7],
        "health": [8],
        "lifeSatisfaction": [6],
        "safety": [9],
    })

    validate_input_data(df)


def test_validate_missing_column():
    df = pd.DataFrame({
        "country": ["한국"],
        "income": [6],
    })

    with pytest.raises(ValueError):
        validate_input_data(df)