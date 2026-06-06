# Neural City Internship Assignment — Submission

**Submission Form:** https://forms.gle/LZj1iX1C25m9vJfv7  
**Assignment:** Improve Neural City Dashboard Using Public Data  
**Role:** Product Engineering Intern  

---

## 1. Prototype Link

> Run locally: `npm install && npm run dev` → http://localhost:5173  
> (Static build available via `npm run build` → `dist/`)

---

## 2. Public Dataset Used

| Field | Detail |
|---|---|
| **Dataset** | CPCB Air Quality Index (AQI) Daily Station Data |
| **Source** | Central Pollution Control Board — [data.gov.in](https://data.gov.in) / [cpcb.nic.in](https://cpcb.nic.in) |
| **Format** | CSV — station-level daily readings |
| **Parameters** | PM2.5, PM10, NO2, SO2, CO, Ozone → aggregated AQI (0–500) |
| **Coverage** | 200+ Indian cities, multiple monitoring stations per city |
| **License** | Open Government Data (OGD) — publicly available |

---

## 3. Why This Dataset (50 words)

Neural City ranks cities on street-level infrastructure — roads, cleanliness, public spaces — but ignores the air citizens breathe. CPCB AQI data is freely available, city-level, and directly mappable to Neural City's existing city list. Air quality affects daily health and is the most impactful missing dimension of urban liveability.

---

## 4. Data Cleaning, Transformation & Structure

### Step 1 — Ingest & Filter
- Loaded CPCB CSV with columns: `Station, City, State, Date, PM2.5, PM10, NO2, SO2, CO, Ozone, AQI`
- Dropped any monitoring station with **>30% missing AQI readings** in the sample period to avoid skewed city averages

### Step 2 — Aggregate
- Computed **mean daily AQI per city across all valid stations** (handles cities with multiple monitoring points)
- Averaged across all dates in the sample to produce a single representative monthly AQI per city

### Step 3 — Normalize
- Mapped raw AQI (0–500) to a 0–100 score using an inverse scale consistent with Neural City's scoring convention:
  ```
  AQI Score = max(0, 100 − AQI ÷ 5)
  ```
  Examples: AQI 50 → Score 90 (Good) · AQI 200 → Score 60 (Moderate) · AQI 285 → Score 43 (Poor)

### Step 4 — City Name Reconciliation
- Applied a manual override map for known mismatches (e.g. `"Bangalore"` → `"Bengaluru"`, `"Bombay"` → `"Mumbai"`)
- Used `difflib.SequenceMatcher` fuzzy matching (threshold 0.7) to catch remaining variants

### Step 5 — Composite Livability Index
- Merged AQI score with Neural City infrastructure score using a weighted formula:
  ```
  Livability Index = 0.6 × Infrastructure Score + 0.4 × AQI Score
  ```
- Weights are configurable in `etl/process_aqi.py` (`LIVABILITY_WEIGHTS`)

### Step 6 — Output
- Produced `src/data/cities.json` with fields:
  ```json
  { "city", "neural_score", "aqi_score", "aqi_raw", "livability_index", "lat", "lon" }
  ```
- Consumed directly by the React frontend — no backend required for the prototype

---

## 5. Prototype Features

| View | What It Shows |
|---|---|
| **City Cards** | Per-city score bars for Infrastructure, Air Quality, and Livability; AQI category badge; sortable by any metric |
| **Comparison Chart** | Horizontal bar chart — side-by-side Infrastructure vs AQI Score vs Livability for all cities; AQI bars color-coded by category |
| **AQI Scatter Map** | Cities plotted by (Infrastructure Score, AQI Score); bubble size = Livability Index; reference lines at dataset averages |

---

## 6. Use Cases Addressed

**Municipal Officers**  
A city scoring 74/100 on Neural City infrastructure but showing AQI 178 (Poor) immediately signals that physical cleanliness is not translating to environmental health — directing policy attention toward vehicular emissions or industrial zones.

**Citizens**  
The Livability Index gives a single number that captures both how well-maintained streets are and how clean the air is — useful for relocation or city comparison decisions.

**City Comparisons**  
The composite index prevents a city from topping rankings purely on infrastructure while masking hazardous air quality. Delhi (infrastructure 65, AQI 285) and Chandigarh (infrastructure 82, AQI 75) tell very different stories — the dashboard makes that visible at a glance.

---

## 7. Tech Stack

| Layer | Tool |
|---|---|
| Data Processing | Python, pandas, difflib |
| Frontend | React 18, Vite |
| Charts | Recharts |
| Styling | Tailwind CSS |
| Data Format | Static JSON (no backend) |

---

## 8. How to Run

```bash
# Frontend
npm install
npm run dev          # → http://localhost:5173

# Regenerate cities.json from fresh CPCB data
pip install pandas
python etl/process_aqi.py --input etl/sample_data.csv --output src/data/cities.json
```
