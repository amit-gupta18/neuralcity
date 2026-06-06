import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts'
import { getCategory, AQI_CATEGORIES } from '../utils/aqi'

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const cat = getCategory(d.aqi_raw)
  return (
    <div className="cut-sm bg-white p-3 text-xs shadow-md min-w-[150px]" style={{ border: '1px solid #e2ddd7' }}>
      <p className="font-semibold text-stone-800 mb-2">{d.city}</p>
      <p className="text-stone-500">Infrastructure <span className="font-medium text-amber-600">{d.neural_score}</span></p>
      <p className="text-stone-500">Air Quality <span className="font-medium" style={{ color: cat.color }}>{d.aqi_score}</span></p>
      <p className="text-stone-500">Livability <span className="font-medium" style={{ color: '#f43f5e' }}>{d.livability_index}</span></p>
      <p className="mt-1.5 font-medium" style={{ color: cat.color }}>{cat.label} · AQI {d.aqi_raw}</p>
    </div>
  )
}

const CustomDot = ({ cx, cy, payload }) => {
  const cat = getCategory(payload.aqi_raw)
  const r = 7 + (payload.livability_index - 50) / 10
  return (
    <g>
      <rect x={cx - r - 4} y={cy - r - 4} width={(r + 4) * 2} height={(r + 4) * 2} fill={cat.color} opacity={0.08} />
      <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} fill={cat.color} opacity={0.75} stroke="white" strokeWidth={1.5} />
      <text x={cx} y={cy - r - 6} textAnchor="middle" fill="#57534e" fontSize={10} fontWeight="500">
        {payload.city}
      </text>
    </g>
  )
}

export default function AQIMap({ cities }) {
  return (
    <div className="cut-border p-px" style={{ backgroundColor: '#e2ddd7' }}>
      <div className="cut bg-white p-6">
        <h2 className="text-base font-semibold text-stone-800 mb-0.5">Infrastructure vs Air Quality</h2>
        <p className="text-sm text-stone-400 mb-6">
          Bubble position = scores · size = Livability Index · colour = AQI category
        </p>

        <ResponsiveContainer width="100%" height={420}>
          <ScatterChart margin={{ top: 20, right: 30, bottom: 24, left: 20 }}>
            <XAxis
              type="number" dataKey="neural_score" name="Infrastructure"
              domain={[50, 95]} axisLine={false} tickLine={false}
              tick={{ fill: '#a8a29e', fontSize: 11 }}
              label={{ value: 'Infrastructure Score', position: 'insideBottom', offset: -16, fill: '#a8a29e', fontSize: 11 }}
            />
            <YAxis
              type="number" dataKey="aqi_score" name="Air Quality"
              domain={[30, 95]} axisLine={false} tickLine={false}
              tick={{ fill: '#a8a29e', fontSize: 11 }}
              label={{ value: 'Air Quality Score', angle: -90, position: 'insideLeft', offset: 12, fill: '#a8a29e', fontSize: 11 }}
            />
            <ZAxis type="number" dataKey="livability_index" range={[200, 800]} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e7e5e4', strokeDasharray: '4 4' }} />
            <ReferenceLine x={72} stroke="#e2ddd7" strokeDasharray="3 3" label={{ value: 'avg', fill: '#c8c0b8', fontSize: 10 }} />
            <ReferenceLine y={68} stroke="#e2ddd7" strokeDasharray="3 3" label={{ value: 'avg', fill: '#c8c0b8', fontSize: 10 }} />
            <Scatter data={cities} shape={<CustomDot />}>
              {cities.map(e => <Cell key={e.city} fill={getCategory(e.aqi_raw).color} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        <div className="mt-5 flex flex-wrap gap-3">
          {AQI_CATEGORIES.map(cat => (
            <span key={cat.label} className="flex items-center gap-1.5 text-xs text-stone-500">
              <span className="w-2 h-2 shrink-0" style={{ backgroundColor: cat.color }} />
              {cat.label} <span className="text-stone-400">({cat.min}–{cat.max})</span>
            </span>
          ))}
        </div>

        <p className="mt-3 text-xs text-stone-400">
          <span className="font-medium text-rose-500">Bottom-right quadrant</span> — strong infrastructure,
          poor air quality — highest priority for environmental intervention.
        </p>
      </div>
    </div>
  )
}
