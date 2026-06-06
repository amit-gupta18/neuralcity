"""
Neural City AQI ETL Pipeline
------------------------------
Reads real station-level AQI data (sourced from aqicn.org / aqi.in / CPCB),
aggregates to city level, normalises scores, and merges with Neural City
infrastructure scores to produce src/data/cities.json.

Data format expected (real_data.csv columns):
  city, station_name, aqi_us, pm25_ugm3, pm10_ugm3,
  co_ppb, so2_ppb, no2_ppb, o3_ppb,
  temperature_c, humidity_pct, timestamp, source_url

Usage:
    python etl/process_aqi.py
    python etl/process_aqi.py --input etl/real_data.csv --output src/data/cities.json
"""

import argparse
import json
import pathlib
import sys
from datetime import datetime, timedelta

import pandas as pd

# ── Neural City infrastructure scores ────────────────────────────────────────
NEURAL_SCORES = {
    "Delhi":      65,
    "Mumbai":     72,
    "Bengaluru":  78,
    "Chennai":    70,
    "Hyderabad":  75,
    "Kolkata":    60,
    "Pune":       80,
    "Ahmedabad":  74,
    "Jaipur":     68,
    "Chandigarh": 82,
}

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

# ── Helpers ───────────────────────────────────────────────────────────────────

def aqi_to_score(aqi: float) -> int:
    return max(0, round(100 - aqi / 5))

def compute_livability(neural: float, aqi_score: float) -> float:
    w = LIVABILITY_WEIGHTS
    return round(w["neural"] * neural + w["aqi"] * aqi_score, 1)

# ── Pipeline steps ────────────────────────────────────────────────────────────

def load(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    required = {"city", "station_name", "aqi_us", "timestamp", "source_url"}
    missing = required - set(df.columns)
    if missing:
        sys.exit(f"[ERROR] Missing columns in CSV: {missing}")
    df["aqi_us"]    = pd.to_numeric(df["aqi_us"], errors="coerce")
    df["timestamp"] = pd.to_datetime(df["timestamp"], errors="coerce")
    print(f"  Loaded {len(df)} rows, {df['city'].nunique()} cities.")
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    original = len(df)

    # 1. Drop rows where AQI is missing
    df = df.dropna(subset=["aqi_us"])

    # 2. Drop physically impossible AQI readings (> 500 = sensor error)
    outliers = df["aqi_us"] > 500
    if outliers.any():
        print(f"  Dropped {outliers.sum()} rows with AQI > 500 (sensor error): "
              f"{df[outliers][['city','station_name','aqi_us']].to_dict('records')}")
    df = df[~outliers]

    # 3. Drop stale data — older than 60 days from the most recent timestamp
    max_ts = df["timestamp"].max()
    cutoff  = max_ts - timedelta(days=60)
    stale   = df["timestamp"] < cutoff
    if stale.any():
        print(f"  Dropped {stale.sum()} stale rows (older than 60 days from {max_ts.date()}):")
        print(f"    {df[stale][['city','station_name','timestamp']].to_string(index=False)}")
    df = df[~stale]

    # 4. Drop iqair.com rows — these are city-level aggregates repeated per
    #    neighbourhood, inflating the station count with duplicate readings.
    iqair = df["source_url"].str.contains("iqair.com", na=False)
    if iqair.any():
        print(f"  Dropped {iqair.sum()} IQAir aggregate rows (city-level duplicates).")
    df = df[~iqair]

    # 5. Within each city, drop stations whose AQI is more than 3 std-devs
    #    from the city mean (catches remaining sensor malfunctions).
    before     = len(df)
    city_mean  = df.groupby("city")["aqi_us"].transform("mean")
    city_std   = df.groupby("city")["aqi_us"].transform("std").fillna(0)
    city_count = df.groupby("city")["aqi_us"].transform("count")
    in_range   = (abs(df["aqi_us"] - city_mean) <= 3 * city_std) | (city_count < 4)
    df = df[in_range].reset_index(drop=True)
    removed = before - len(df)
    if removed:
        print(f"  Dropped {removed} within-city statistical outliers (±3σ).")

    print(f"  After cleaning: {len(df)} rows (removed {original - len(df)} total).")
    return df.reset_index(drop=True)


def aggregate(df: pd.DataFrame) -> pd.DataFrame:
    city_avg = (
        df.groupby("city")["aqi_us"]
        .agg(aqi_raw="mean", station_count="count")
        .reset_index()
    )
    city_avg["aqi_raw"] = city_avg["aqi_raw"].round(0).astype(int)
    return city_avg


def build_output(city_avg: pd.DataFrame) -> list[dict]:
    records = []
    for _, row in city_avg.iterrows():
        city = row["city"]
        if city not in NEURAL_SCORES:
            print(f"  Skipping '{city}' — no Neural City infrastructure score on file.")
            continue
        aqi_raw      = int(row["aqi_raw"])
        aqi_score    = aqi_to_score(aqi_raw)
        neural_score = NEURAL_SCORES[city]
        livability   = compute_livability(neural_score, aqi_score)
        coords       = CITY_COORDS.get(city, {"lat": 20.5, "lon": 78.9})
        records.append({
            "city":             city,
            "neural_score":     neural_score,
            "aqi_score":        aqi_score,
            "aqi_raw":          aqi_raw,
            "livability_index": livability,
            "stations_used":    int(row["station_count"]),
            **coords,
        })
    records.sort(key=lambda r: r["livability_index"], reverse=True)
    return records


def main():
    parser = argparse.ArgumentParser(description="Neural City AQI ETL")
    parser.add_argument("--input",  default="etl/real_data.csv",       help="Path to station-level AQI CSV")
    parser.add_argument("--output", default="src/data/cities.json",    help="Output JSON path")
    args = parser.parse_args()

    print(f"\n[1/4] Loading  {args.input}")
    df = load(args.input)

    print("\n[2/4] Cleaning")
    df = clean(df)

    print("\n[3/4] Aggregating per city")
    city_avg = aggregate(df)
    print(f"  City averages:\n{city_avg.to_string(index=False)}")

    print("\n[4/4] Building output")
    records = build_output(city_avg)

    out_path = pathlib.Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(records, indent=2))
    print(f"\n  Wrote {len(records)} cities to {args.output}")
    print(f"  Top city: {records[0]['city']}  (livability {records[0]['livability_index']})")
    print(f"  Data date: {df['timestamp'].max().date()}  (source: aqi.in / aqicn.org / CPCB)\n")


if __name__ == "__main__":
    main()
