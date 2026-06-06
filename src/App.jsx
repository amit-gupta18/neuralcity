import { useState } from 'react'
import cities from './data/cities.json'
import CityCard from './components/CityCard'
import ComparisonChart from './components/ComparisonChart'
import AQIMap from './components/AQIMap'
import { getCategory } from './utils/aqi'

const SORT_OPTIONS = [
  { value: 'livability_index', label: 'Livability' },
  { value: 'neural_score',    label: 'Infrastructure' },
  { value: 'aqi_score',       label: 'Air Quality' },
  { value: 'aqi_raw',         label: 'Raw AQI' },
]

const TABS = [
  { id: 'cards',  label: 'City Cards' },
  { id: 'chart',  label: 'Comparison Chart' },
  { id: 'map',    label: 'AQI Scatter Map' },
]

function StatTile({ label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-4">
      <div className={`text-2xl font-extrabold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-600 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('cards')
  const [sortBy, setSortBy] = useState('livability_index')
  const [sortDir, setSortDir] = useState('desc')

  const sorted = [...cities].sort((a, b) =>
    sortDir === 'desc' ? b[sortBy] - a[sortBy] : a[sortBy] - b[sortBy]
  )

  const avgLivability = (cities.reduce((s, c) => s + c.livability_index, 0) / cities.length).toFixed(1)
  const best = cities.reduce((a, b) => a.livability_index > b.livability_index ? a : b)
  const alertCount = cities.filter(c => c.aqi_raw > 200).length

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              <span className="text-cyan-400">Neural</span>
              <span className="text-white"> City</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Urban Liveability Dashboard — CPCB AQI Integration</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Monthly averaged data · {cities.length} cities
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatTile label="Cities Tracked" value={cities.length} sub="across India" color="text-cyan-400" />
          <StatTile label="Avg Livability Index" value={avgLivability} sub="out of 100" color="text-purple-400" />
          <StatTile
            label="Top City"
            value={best.city}
            sub={`Livability ${best.livability_index}`}
            color="text-green-400"
          />
          <StatTile
            label="Air Quality Alerts"
            value={alertCount}
            sub={`${alertCount} cities AQI > 200`}
            color={alertCount > 0 ? 'text-orange-400' : 'text-green-400'}
          />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards tab: sort controls */}
        {activeTab === 'cards' && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-400">Sort by:</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => {
                  if (sortBy === opt.value) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
                  else { setSortBy(opt.value); setSortDir('desc') }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  sortBy === opt.value
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-800 text-gray-400 hover:text-gray-200'
                }`}
              >
                {opt.label}
                {sortBy === opt.value && (
                  <span className="ml-1 text-gray-400">{sortDir === 'desc' ? '↓' : '↑'}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Tab content */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sorted.map((city, i) => (
              <CityCard key={city.city} city={city} rank={i + 1} />
            ))}
          </div>
        )}

        {activeTab === 'chart' && <ComparisonChart cities={cities} />}

        {activeTab === 'map' && <AQIMap cities={cities} />}

        {/* Formula note */}
        <div className="border border-gray-800 rounded-xl p-4 bg-gray-900/50 text-xs text-gray-500 space-y-1">
          <p><span className="text-gray-300 font-semibold">Scoring methodology</span></p>
          <p>AQI Score = max(0, 100 − AQI ÷ 5) &nbsp;·&nbsp; Livability Index = 0.6 × Infrastructure + 0.4 × AQI Score</p>
          <p>Source: CPCB (Central Pollution Control Board) via data.gov.in &nbsp;·&nbsp; Infrastructure scores from Neural City street-level index</p>
        </div>
      </main>
    </div>
  )
}
