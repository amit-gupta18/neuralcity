import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts'
import { getCategory } from '../utils/aqi'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="cut-sm bg-white p-3 text-sm shadow-md" style={{ border: '1px solid #e2ddd7' }}>
      <p className="font-medium text-stone-700 mb-2">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-semibold">{p.value}</span>
        </p>
      ))}
    </div>
  )
}

export default function ComparisonChart({ cities }) {
  const data = [...cities].sort((a, b) => b.livability_index - a.livability_index)

  return (
    <div className="cut-border p-px" style={{ backgroundColor: '#e2ddd7' }}>
      <div className="cut bg-white p-6">
        <h2 className="text-base font-semibold text-stone-800 mb-0.5">City Score Comparison</h2>
        <p className="text-sm text-stone-400 mb-6">
          Ranked by Livability — where Infrastructure outpaces Air Quality signals intervention priorities
        </p>

        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 24, left: 80, bottom: 0 }}
            barCategoryGap="30%"
            barGap={3}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe4" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fill: '#a8a29e', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category" dataKey="city" width={75}
              tick={{ fill: '#78716c', fontSize: 12 }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Legend
              wrapperStyle={{ paddingTop: 20 }}
              formatter={v => <span style={{ color: '#78716c', fontSize: 12 }}>{v}</span>}
            />
            <Bar dataKey="neural_score"     name="Infrastructure"   fill="#f59e0b" radius={0} />
            <Bar dataKey="aqi_score"        name="Air Quality"      radius={0}>
              {data.map(entry => (
                <Cell key={entry.city} fill={getCategory(entry.aqi_raw).color} />
              ))}
            </Bar>
            <Bar dataKey="livability_index" name="Livability Index" fill="#f43f5e" radius={0} />
          </BarChart>
        </ResponsiveContainer>

        <p className="mt-4 text-xs text-stone-400">
          <span className="font-medium text-amber-600">Tip:</span> Cities where Air Quality is significantly lower
          than Infrastructure are highest-priority targets for emission control policy.
        </p>
      </div>
    </div>
  )
}
