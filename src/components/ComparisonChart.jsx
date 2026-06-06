import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { getCategory } from '../utils/aqi'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-sm shadow-xl">
      <p className="font-bold text-white mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function ComparisonChart({ cities }) {
  const data = [...cities].sort((a, b) => b.livability_index - a.livability_index)

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h2 className="text-white font-bold text-lg mb-1">City Score Comparison</h2>
      <p className="text-gray-400 text-sm mb-6">
        Cities ranked by Livability Index — spot infrastructure vs air quality gaps
      </p>

      <ResponsiveContainer width="100%" height={420}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 30, left: 80, bottom: 0 }}
          barCategoryGap="28%"
          barGap={3}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="city"
            width={75}
            tick={{ fill: '#d1d5db', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
          <Legend
            wrapperStyle={{ color: '#9ca3af', fontSize: 12, paddingTop: 16 }}
            formatter={v => <span style={{ color: '#d1d5db' }}>{v}</span>}
          />
          <Bar dataKey="neural_score" name="Infrastructure" fill="#22d3ee" radius={[0, 3, 3, 0]} />
          <Bar dataKey="aqi_score" name="Air Quality" radius={[0, 3, 3, 0]}>
            {data.map(entry => (
              <Cell key={entry.city} fill={getCategory(entry.aqi_raw).color} />
            ))}
          </Bar>
          <Bar dataKey="livability_index" name="Livability Index" fill="#c084fc" radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
        <span className="text-cyan-400 font-semibold">Tip:</span> Cities where the Air Quality bar is significantly
        shorter than Infrastructure signal targeted intervention opportunities for emission controls.
      </div>
    </div>
  )
}
