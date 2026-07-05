from pathlib import Path
import requests

OUTPUT = Path("data/raw/oecd_bli_raw.csv")

URL = "여기에 OECD csv"

response = requests.get(URL)

OUTPUT.write_bytes(response.content)

print("download complete")