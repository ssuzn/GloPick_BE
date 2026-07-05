from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd

from preprocessing.config import INDICATORS
from preprocessing.logger import logger


def save_distribution_plots(
    original_df: pd.DataFrame,
    score_df: pd.DataFrame,
    output_dir: Path,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    for indicator in INDICATORS:
        plt.figure(figsize=(8, 4))
        plt.hist(original_df[indicator], bins=10)
        plt.title(f"{indicator} raw distribution")
        plt.xlabel(indicator)
        plt.ylabel("count")
        plt.tight_layout()
        plt.savefig(output_dir / f"{indicator}_raw.png")
        plt.close()

        plt.figure(figsize=(8, 4))
        plt.hist(score_df[indicator], bins=10)
        plt.title(f"{indicator} normalized score distribution")
        plt.xlabel("score")
        plt.ylabel("count")
        plt.tight_layout()
        plt.savefig(output_dir / f"{indicator}_score.png")
        plt.close()

    logger.info(f"분포 그래프 저장 완료: {output_dir}")