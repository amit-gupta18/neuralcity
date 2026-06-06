export const AQI_CATEGORIES = [
  { label: 'Good',        min: 0,   max: 50,  color: '#22c55e', tailwind: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/30' },
  { label: 'Satisfactory',min: 51,  max: 100, color: '#a3e635', tailwind: 'text-lime-400',   bg: 'bg-lime-500/10',   border: 'border-lime-500/30'  },
  { label: 'Moderate',    min: 101, max: 200, color: '#facc15', tailwind: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { label: 'Poor',        min: 201, max: 300, color: '#fb923c', tailwind: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { label: 'Very Poor',   min: 301, max: 400, color: '#ef4444', tailwind: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30'   },
  { label: 'Severe',      min: 401, max: 500, color: '#991b1b', tailwind: 'text-red-800',    bg: 'bg-red-900/20',    border: 'border-red-900/40'   },
]

export function getCategory(aqi) {
  return AQI_CATEGORIES.find(c => aqi >= c.min && aqi <= c.max) ?? AQI_CATEGORIES[AQI_CATEGORIES.length - 1]
}

export function getScoreColor(score) {
  if (score >= 75) return '#22c55e'
  if (score >= 60) return '#facc15'
  if (score >= 45) return '#fb923c'
  return '#ef4444'
}
