# Architecture: Neural City AQI Integration Layer

**Assignment:** Improve Neural City Dashboard Using Public Data  
**Dataset:** CPCB Air Quality Index (AQI) Data  
**Role:** Product Engineering Intern

---

## 1. Problem Statement

Neural City's ranking dashboard scores Indian cities on street-level infrastructure — roads, footpaths, cleanliness, and public spaces. It currently has no environmental data layer. A city can score high on cleanliness yet have hazardous air quality. This gap makes the dashboard incomplete for both municipal officers and citizens trying to assess true urban liveability.

**Goal:** Integrate CPCB AQI data to add an environmental dimension to city rankings and surface a composite Livability Index.

---

## 2. Dataset

| Property | Detail |
|---|---|
| Source | Central Pollution Control Board (CPCB) via `cpcb.nic.in` / `data.gov.in` |
| Format | CSV — daily station-level AQI readings |
| Coverage | 200+ Indian cities, multiple monitoring stations per city |
| Parameters | PM2.5, PM10, NO2, SO2, CO, Ozone — aggregated into AQI score (0–500) |
| Update Frequency | Daily |
| License | Open Government Data (OGD) — publicly available |

---

## 3. Data Pipeline

```
CPCB Raw CSV
     │
     ▼
[1] Ingest & Parse
     - Load city-station-date-AQI rows
     - Drop stations with >30% missing readings in a month
     │
     ▼
[2] Aggregate
     - Average daily AQI per city per month
     - Handle multiple stations per city (mean across stations)
     │
     ▼
[3] Normalize
     - Map raw AQI (0–500) → Score (0–100) using inverse scale
       Score = max(0, 100 - (AQI / 5))
     - Aligns with Neural City's 0–100 scoring convention
     │
     ▼
[4] City Name Reconciliation
     - Fuzzy match CPCB city names → Neural City city list
     - Manual override map for known mismatches
       e.g. "Bengaluru" ↔ "Bangalore"
     │
     ▼
[5] Composite Index
     - Livability Index = 0.6 × Neural City Score + 0.4 × AQI Score
     - Weights configurable per use case
     │
     ▼
[6] Output
     - JSON file: { city, neural_score, aqi_score, aqi_raw, livability_index }
     - Consumed by the prototype frontend
```

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Data Layer                        │
│                                                     │
│   CPCB CSV ──► Python ETL Script ──► cities.json   │
│                     │                               │
│              (pandas: clean,                        │
│               normalize, merge)                     │
└─────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│                 Frontend (React)                    │
│                                                     │
│  ┌──────────────┐   ┌──────────────┐               │
│  │  City Cards  │   │  Bar Chart   │               │
│  │  AQI Badge   │   │  AQI vs NC   │               │
│  │  Livability  │   │  Score Comp. │               │
│  └──────────────┘   └──────────────┘               │
│                                                     │
│  ┌──────────────────────────────────┐               │
│  │     Color-coded AQI Map         │               │
│  │  Green / Yellow / Red markers   │               │
│  └──────────────────────────────────┘               │
└─────────────────────────────────────────────────────┘
```

---

## 5. Prototype Components

### 5.1 City Score Cards
Each city card shows:
- Neural City infrastructure score
- AQI score (normalized)
- Raw AQI value with category label (Good / Moderate / Poor / Severe)
- Composite Livability Index

### 5.2 Comparison Bar Chart
Side-by-side horizontal bar chart comparing cities on:
- Infrastructure score (Neural City)
- AQI score
- Livability Index

Helps municipal officers instantly spot cities that rank well on infrastructure but poorly on air quality — a signal for targeted intervention.

### 5.3 AQI Category Color Coding

| AQI Range | Category | Color |
|---|---|---|
| 0 – 50 | Good | Green |
| 51 – 100 | Satisfactory | Light Green |
| 101 – 200 | Moderate | Yellow |
| 201 – 300 | Poor | Orange |
| 301 – 400 | Very Poor | Red |
| 401 – 500 | Severe | Dark Red |

---

## 6. Use Cases

**For Municipal Officers:**
A city scoring 78/100 on Neural City's infrastructure index but showing AQI 280 (Poor) signals that physical cleanliness efforts are not translating to environmental health — directing budget attention to vehicular emissions or industrial zones.

**For Citizens:**
Before relocating or comparing cities, citizens can see a single Livability Index that captures both how well-maintained the streets are and how clean the air is.

**For City Comparisons:**
The composite index allows fair ranking across cities with different strengths — a city can no longer rank top purely on infrastructure while ignoring environmental health.

---

## 7. Tech Stack

| Layer | Tool |
|---|---|
| Data Processing | Python, pandas |
| Normalization | Custom scoring formula |
| Frontend | React, Recharts |
| Styling | Tailwind CSS |
| Data Format | Static JSON (no backend needed for prototype) |

---

## 8. Limitations & Future Scope

- Prototype uses static monthly-averaged data; production would pull live CPCB API
- AQI station coverage is uneven — smaller cities have fewer monitoring stations
- Future: add PM2.5 trend lines, seasonal heatmaps, ward-level AQI overlay on Neural City's street maps
- Future: weight the Livability Index dynamically based on user role (officer vs citizen)

---

## 9. Why This Dataset

CPCB AQI data is the most direct environmental complement to Neural City's street-level infrastructure scores. Air quality affects every citizen daily and is a core component of urban liveability that no city ranking should omit. The data is freely available, city-level, and directly mappable to Neural City's existing city list — making integration low-friction and high-impact.

---

*Submitted for: Neural City Product Engineering Internship Assignment*