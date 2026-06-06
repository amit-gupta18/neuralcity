import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { getCategory, AQI_CATEGORIES } from '../utils/aqi'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const cat = getCategory(d.aqi_raw)
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl min-w-[160px]">
      <p className="font-bold text-white mb-2">{d.city}</p>
      <p className="text-cyan-400">Infrastructure: <span className="font-semibold">{d.neural_score}</span></p>
      <p style={{ color: cat.color }}>Air Quality: <span className="font-semibold">{d.aqi_score}</span></p>
      <p className="text-purple-400">Livability: <span className="font-semibold">{d.livability_index}</span></p>
      <p className={`mt-1 text-xs font-semibold ${cat.tailwind}`}>AQI {d.aqi_raw} — {cat.label}</p>
    </div>
  )
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props
  const cat = getCategory(payload.aqi_raw)
  const r = 8 + (payload.livability_index - 50) / 10
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 4} fill={cat.color} opacity={0.15} />
      <circle cx={cx} cy={cy} r={r} fill={cat.color} opacity={0.85} stroke="#1f2937" strokeWidth={1.5} />
      <text x={cx} y={cy - r - 5} textAnchor="middle" fill="#e5e7eb" fontSize={10} fontWeight="600">
        {payload.city}
      </text>
    </g>
  )
}

export default function AQIMap({ cities }) {
  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h2 className="text-white font-bold text-lg mb-1">Infrastructure vs Air Quality</h2>
      <p className="text-gray-400 text-sm mb-6">
        Each bubble is a city — position shows scores, size scales with Livability Index, color shows AQI category
      </p>

      <ResponsiveContainer width="100%" height={440}>
        <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
          <XAxis
            type="number"
            dataKey="neural_score"
            name="Infrastructure"
            domain={[50, 95]}
            label={{ value: 'Infrastructure Score →', position: 'insideBottom', offset: -12, fill: '#6b7280', fontSize: 12 }}
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="aqi_score"
            name="Air Quality"
            domain={[30, 95]}
            label={{ value: 'Air Quality Score →', angle: -90, position: 'insideLeft', offset: 10, fill: '#6b7280', fontSize: 12 }}
            tick={{ fill: '#6b7280', fontSize: 11 }}
          />
          <ZAxis type="number" dataKey="livability_index" range={[200, 800]} />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#374151', strokeDasharray: '4 4' }} />
          <ReferenceLine x={72} stroke="#374151" strokeDasharray="3 3" label={{ value: 'Avg Infra', fill: '#4b5563', fontSize: 10 }} />
          <ReferenceLine y={68} stroke="#374151" strokeDasharray="3 3" label={{ value: 'Avg AQI Score', fill: '#4b5563', fontSize: 10 }} />
          <Scatter data={cities} shape={<CustomDot />}>
            {cities.map(entry => (
              <Cell key={entry.city} fill={getCategory(entry.aqi_raw).color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      <div className="mt-4 flex flex-wrap gap-3">
        {AQI_CATEGORIES.map(cat => (
          <span key={cat.label} className="flex items-center gap-1.5 text-xs">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="text-gray-400">{cat.label} ({cat.min}–{cat.max})</span>
          </span>
        ))}
      </div>

      <div className="mt-3 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
        <span className="text-purple-400 font-semibold">Reading the chart:</span> Cities in the top-right quadrant
        score well on both dimensions. Cities in the bottom-right have strong infrastructure but poor air quality
        — the highest-priority targets for environmental intervention.
      </div>
    </div>
  )
}
