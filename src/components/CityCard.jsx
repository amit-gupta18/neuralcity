import { getCategory } from '../utils/aqi'

function ScoreBar({ label, value, color }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-stone-400 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 overflow-hidden" style={{ backgroundColor: '#f0ebe4' }}>
        <div className="h-full" style={{ width: `${value}%`, backgroundColor: color, opacity: 0.85 }} />
      </div>
      <span className="text-xs font-medium w-7 text-right tabular-nums" style={{ color }}>{value}</span>
    </div>
  )
}

export default function CityCard({ city, rank }) {
  const cat = getCategory(city.aqi_raw)

  return (
    /* Outer wrapper = border colour, inner = white — both share clip-path */
    <div className="cut-border p-px" style={{ backgroundColor: '#e2ddd7' }}>
      <div className="cut flex items-stretch bg-white hover:bg-stone-50 transition-colors">

        {/* Coloured left strip */}
        <div className="w-1 shrink-0" style={{ backgroundColor: cat.color }} />

        {/* City identity */}
        <div className="w-44 shrink-0 flex items-center gap-3 px-4 py-4" style={{ borderRight: '1px solid #f0ebe4' }}>
          <div
            className="cut-xs w-7 h-7 flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ backgroundColor: `${cat.color}18`, color: cat.color }}
          >
            {rank}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-800 leading-tight truncate">{city.city}</p>
            <p className="text-xs mt-0.5" style={{ color: cat.color }}>{cat.label} · AQI {city.aqi_raw}</p>
          {city.stations_used && (
            <p className="text-xs text-stone-400 mt-0.5">{city.stations_used} stations</p>
          )}
          </div>
        </div>

        {/* Score bars */}
        <div className="flex-1 flex items-center px-6 py-4">
          <div className="w-full space-y-2.5">
            <ScoreBar label="Infrastructure" value={city.neural_score}     color="#f59e0b" />
            <ScoreBar label="Air Quality"    value={city.aqi_score}        color={cat.color} />
            <ScoreBar label="Livability"     value={city.livability_index} color="#f43f5e" />
          </div>
        </div>

        {/* Livability callout */}
        <div
          className="w-20 shrink-0 flex flex-col items-center justify-center px-4 py-4"
          style={{ borderLeft: '1px solid #f0ebe4' }}
        >
          <span className="text-xl font-semibold tabular-nums" style={{ color: '#f43f5e' }}>
            {city.livability_index}
          </span>
          <span className="text-xs text-stone-400 mt-0.5">/ 100</span>
        </div>

      </div>
    </div>
  )
}
