import { getCategory } from '../utils/aqi'

function ScoreBar({ label, value, color }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-400">{label}</span>
        <span className="font-semibold" style={{ color }}>{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

export default function CityCard({ city, rank }) {
  const cat = getCategory(city.aqi_raw)

  return (
    <div className={`rounded-xl border bg-gray-900 p-5 flex flex-col gap-4 ${cat.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">#{rank}</span>
            <h2 className="text-lg font-bold text-white">{city.city}</h2>
          </div>
          <span className={`mt-1 inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cat.bg} ${cat.tailwind}`}>
            {cat.label}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-purple-400">{city.livability_index}</div>
          <div className="text-xs text-gray-500">Livability</div>
        </div>
      </div>

      <div className="space-y-3">
        <ScoreBar label="Infrastructure (Neural City)" value={city.neural_score} color="#22d3ee" />
        <ScoreBar label="Air Quality Score" value={city.aqi_score} color={cat.color} />
        <ScoreBar label="Livability Index" value={city.livability_index} color="#c084fc" />
      </div>

      <div className="flex justify-between text-xs pt-1 border-t border-gray-800">
        <span className="text-gray-500">Raw AQI</span>
        <span className={`font-bold ${cat.tailwind}`}>{city.aqi_raw}</span>
      </div>
    </div>
  )
}
