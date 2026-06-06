import { useState } from 'react'
import cities from './data/cities.json'
import CityCard from './components/CityCard'
import ComparisonChart from './components/ComparisonChart'
import AQIMap from './components/AQIMap'

const SORT_OPTIONS = [
  { value: 'livability_index', label: 'Livability' },
  { value: 'neural_score',    label: 'Infrastructure' },
  { value: 'aqi_score',       label: 'Air Quality' },
  { value: 'aqi_raw',         label: 'Raw AQI' },
]

const TABS = [
  { id: 'cards', label: 'City Cards' },
  { id: 'chart', label: 'Comparison' },
  { id: 'map',   label: 'AQI Map' },
]

/* Wrapper pattern: outer div = border colour + clip, inner div = bg + clip */
function StatTile({ label, value, sub, accent }) {
  return (
    <div className="cut-border p-px" style={{ backgroundColor: '#e2ddd7' }}>
      <div className="cut bg-white px-5 py-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: accent }} />
        <div className="text-2xl font-semibold tabular-nums mt-1" style={{ color: accent }}>{value}</div>
        <div className="text-sm text-stone-600 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-stone-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('cards')
  const [sortBy, setSortBy]     = useState('livability_index')
  const [sortDir, setSortDir]   = useState('desc')

  const sorted = [...cities].sort((a, b) =>
    sortDir === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]
  )

  const avgLivability = (cities.reduce((s, c) => s + c.livability_index, 0) / cities.length).toFixed(1)
  const best          = cities.reduce((a, b) => a.livability_index > b.livability_index ? a : b)
  const alertCount    = cities.filter(c => c.aqi_raw > 200).length

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f5f2ee' }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="cut-sm w-8 h-8 flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
            >
              NC
            </div>
            <div>
              <span className="text-base font-semibold text-stone-800 tracking-tight">Neural City</span>
              <span className="ml-2 text-xs text-stone-400 font-normal">Liveability Index</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <span className="w-1.5 h-1.5 bg-emerald-400" />
            {cities.length} cities &middot; real-time · Jun 6, 2026
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">

        {/* ── Stats row ──────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Cities tracked"  value={cities.length}   sub="across India"                      accent="#f59e0b" />
          <StatTile label="Avg livability"  value={avgLivability}   sub="out of 100"                        accent="#f43f5e" />
          <StatTile label="Top ranked"      value={best.city}       sub={`score ${best.livability_index}`}   accent="#10b981" />
          <StatTile
            label="AQI alerts"
            value={alertCount}
            sub="cities AQI > 200"
            accent={alertCount > 0 ? '#f97316' : '#10b981'}
          />
        </div>

        {/* ── Tabs + sort ────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center border-b border-stone-200 flex-1">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 text-sm -mb-px border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-700 font-medium'
                    : 'border-transparent text-stone-400 hover:text-stone-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'cards' && (
            <div className="flex items-center gap-1.5 pl-4 pb-px">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (sortBy === opt.value) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
                    else { setSortBy(opt.value); setSortDir('desc') }
                  }}
                  className={`cut-xs px-2.5 py-1 text-xs transition-colors ${
                    sortBy === opt.value
                      ? 'bg-amber-100 text-amber-700 font-medium'
                      : 'bg-white text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {opt.label}{sortBy === opt.value ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Content ────────────────────────────────────── */}
        {activeTab === 'cards' && (
          <div className="flex flex-col gap-2">
            {sorted.map((city, i) => (
              <CityCard key={city.city} city={city} rank={i + 1} />
            ))}
          </div>
        )}

        {activeTab === 'chart' && <ComparisonChart cities={cities} />}
        {activeTab === 'map'   && <AQIMap cities={cities} />}

        <p className="text-xs text-stone-400 text-center pb-4">
          AQI Score = max(0, 100 − AQI ÷ 5) &nbsp;·&nbsp;
          Livability = 0.6 × Infrastructure + 0.4 × AQI &nbsp;·&nbsp;
          Source: aqi.in &amp; aqicn.org (CPCB monitoring network) · Jun 6, 2026 · 127 station readings across 10 cities
        </p>
      </main>
    </div>
  )
}
