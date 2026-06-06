"""
Neural City AQI ETL Pipeline
-----------------------------
Reads CPCB-style station-level AQI CSV, aggregates to city level,
normalizes scores, and merges with Neural City infrastructure scores
to produce a cities.json file consumed by the frontend.

Usage:
    python etl/process_aqi.py --input etl/sample_data.csv --output src/data/cities.json
"""

import argparse
import json
import math
import pathlib
import sys

import pandas as pd
from difflib import SequenceMatcher


# ── Neural City infrastructure scores (mock — replace with real data) ────────
NEURAL_SCORES = {
    "Delhi":      65,
    "Mumbai":     72,
    "Bengaluru":  78,
    "Bangalore":  78,  # alias handled by reconciliation
    "Chennai":    70,
    "Hyderabad":  75,
    "Kolkata":    60,
    "Pune":       80,
    "Ahmedabad":  74,
    "Jaipur":     68,
    "Chandigarh": 82,
}

# ── Manual overrides for known city-name mismatches ─────────────────────────
CITY_NAME_MAP = {
    "Bangalore":    "Bengaluru",
    "Calcutta":     "Kolkata",
    "Bombay":       "Mumbai",
    "New Delhi":    "Delhi",
    "Ahmadabad":    "Ahmedabad",
}

# ── Geographic coordinates (lon, lat) for scatter map ───────────────────────
CITY_COORDS = {
    "Delhi":      {"lat": 28.6, "lon": 77.2},
    "Mumbai":     {"lat": 19.0, "lon": 72.8},
    "Bengaluru":  {"lat": 12.9, "lon": 77.6},
    "Chennai":    {"lat": 13.1, "lon": 80.3},
    "Hyderabad":  {"lat": 17.4, "lon": 78.5},
    "Kolkata":    {"lat": 22.6, "lon": 88.4},
    "Pune":       {"lat": 18.5, "lon": 73.9},
    "Ahmedabad":  {"lat": 23.0, "lon": 72.6},
    "Jaipur":     {"lat": 26.9, "lon": 75.8},
    "Chandigarh": {"lat": 30.7, "lon": 76.8},
}

LIVABILITY_WEIGHTS = {"neural": 0.6, "aqi": 0.4}


def normalize_city_name(name: str, known_cities: list[str]) -> str:
    """Apply manual overrides then fuzzy-match to known city list."""
    name = name.strip()
    if name in CITY_NAME_MAP:
        name = CITY_NAME_MAP[name]
    if name in known_cities:
        return name
    # Fuzzy match
    best, best_score = name, 0.0
    for candidate in known_cities:
        score = SequenceMatcher(None, name.lower(), candidate.lower()).ratio()
        if score > best_score:
            best, best_score = candidate, score
    return best if best_score > 0.7 else name


def aqi_to_score(aqi: float) -> float:
    """Map raw AQI (0–500) to 0–100 score using inverse scale."""
    return max(0.0, 100.0 - (aqi / 5.0))


def compute_livability(neural_score: float, aqi_score: float) -> float:
    w = LIVABILITY_WEIGHTS
    return round(w["neural"] * neural_score + w["aqi"] * aqi_score, 1)


def load_and_clean(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)

    required = {"Station", "City", "AQI", "Date"}
    missing = required - set(df.columns)
    if missing:
        sys.exit(f"Missing required columns: {missing}")

    df["Date"] = pd.to_datetime(df["Date"])
    df["AQI"] = pd.to_numeric(df["AQI"], errors="coerce")

    # Drop stations with >30% missing AQI in the sample period
    station_total = df.groupby("Station")["AQI"].size()
    station_missing = df.groupby("Station")["AQI"].apply(lambda s: s.isna().sum())
    missing_frac = station_missing / station_total
    bad_stations = missing_frac[missing_frac > 0.30].index
    dropped = len(bad_stations)
    df = df[~df["Station"].isin(bad_stations)]
    if dropped:
        print(f"  Dropped {dropped} station(s) with >30% missing readings.")

    df = df.dropna(subset=["AQI"])
    return df


def aggregate(df: pd.DataFrame) -> pd.DataFrame:
    """Average daily AQI per city across all stations."""
    daily = df.groupby(["City", "Date"])["AQI"].mean().reset_index()
    city_avg = daily.groupby("City")["AQI"].mean().reset_index()
    city_avg.columns = ["city_raw", "aqi_raw"]
    city_avg["aqi_raw"] = city_avg["aqi_raw"].round(0).astype(int)
    return city_avg


def build_output(city_avg: pd.DataFrame) -> list[dict]:
    known_cities = list(NEURAL_SCORES.keys())
    records = []

    for _, row in city_avg.iterrows():
        city = normalize_city_name(row["city_raw"], known_cities)
        if city not in NEURAL_SCORES:
            print(f"  Skipping '{row['city_raw']}' — no Neural City score found.")
            continue

        aqi_raw = int(row["aqi_raw"])
        aqi_score = round(aqi_to_score(aqi_raw), 0)
        neural_score = NEURAL_SCORES[city]
        livability = compute_livability(neural_score, aqi_score)
        coords = CITY_COORDS.get(city, {"lat": 20.5, "lon": 78.9})

        records.append({
            "city":             city,
            "neural_score":     neural_score,
            "aqi_score":        int(aqi_score),
            "aqi_raw":          aqi_raw,
            "livability_index": livability,
            **coords,
        })

    records.sort(key=lambda r: r["livability_index"], reverse=True)
    return records


def main():
    parser = argparse.ArgumentParser(description="Neural City AQI ETL")
    parser.add_argument("--input",  default="etl/sample_data.csv", help="Path to CPCB CSV")
    parser.add_argument("--output", default="src/data/cities.json", help="Output JSON path")
    args = parser.parse_args()

    print(f"[1/4] Loading {args.input} …")
    df = load_and_clean(args.input)
    print(f"      {len(df)} rows across {df['City'].nunique()} cities.")

    print("[2/4] Aggregating AQI per city …")
    city_avg = aggregate(df)

    print("[3/4] Normalizing and building output …")
    records = build_output(city_avg)

    print(f"[4/4] Writing {len(records)} cities to {args.output} …")
    out_path = pathlib.Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(records, indent=2))

    print(f"\nDone. Top city: {records[0]['city']} ({records[0]['livability_index']} livability)")


if __name__ == "__main__":
    main()
