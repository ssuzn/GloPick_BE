import json
from pathlib import Path

from preprocessing.logger import logger

def export_processed_json(result: dict, output_path: Path) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as file:
        json.dump(result, file, ensure_ascii=False, indent=2)

    logger.info(f"전처리 완료: {output_path}")