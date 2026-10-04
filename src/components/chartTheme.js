// Shared visual styling for all Recharts charts (presentation only).

export const CHART = {
  grid: '#eff1f4',
  axis: '#e3e6eb',
  tick: '#8b95a5',
  label: '#64748b',
  ink: '#111827',
  muted: '#64748b',
  cursor: '#cbd0d9',
  surface: '#ffffff',
}

export const AXIS_PROPS = {
  stroke: CHART.axis,
  tick: { fill: CHART.tick, fontSize: 11 },
  tickLine: false,
}

export const axisLabel = (value, extra = {}) => ({
  value,
  fill: CHART.label,
  fontSize: 11.5,
  fontWeight: 500,
  ...extra,
})
