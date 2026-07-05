from preprocessing.config import INDICATORS

def validate_input_data(df):
    required_columns = ["country", "countryCode", *INDICATORS]

    missing_columns = [c for c in required_columns if c not in df.columns]

    if missing_columns:
        raise ValueError(f"필수 컬럼 누락: {missing_columns}")

    for indicator in INDICATORS:

        if (df[indicator] < 0).any():
            raise ValueError(f"{indicator} 컬럼에 음수 데이터 존재")

        if (df[indicator] > 100).any():
            raise ValueError(f"{indicator} 컬럼 값 비정상")