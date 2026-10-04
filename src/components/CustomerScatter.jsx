import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { SEGMENTS, SEGMENT_BY_ID } from '../analytics/segments.js'
import { formatCurrency } from '../utils/format.js'
import { ChartTooltipBox, SegmentDot, TooltipRow } from './ui.jsx'
import { AXIS_PROPS, CHART, axisLabel } from './chartTheme.js'

function CustomerTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const c = payload[0].payload
  const seg = SEGMENT_BY_ID[c.segment]
  return (
    <ChartTooltipBox>
      <div className="mb-2 flex items-center gap-2 border-b border-line-2 pb-2 font-semibold text-ink">
        <SegmentDot color={seg.color} size={8} />
        {c.customerId} · {seg.short}
      </div>
      <TooltipRow label="Total spend" value={formatCurrency(c.monetary)} />
      <TooltipRow label="Orders" value={c.frequency} />
      <TooltipRow label="Days since last order" value={c.recency} />
      <TooltipRow label="Value / Engagement" value={`${Math.round(c.valueScore)} / ${Math.round(c.engagementScore)}`} />
    </ChartTooltipBox>
  )
}

// Customer-level scatter, one series per segment. `highlight` dims all other segments.
export default function CustomerScatter({
  customers,
  x,
  y,
  xLabel,
  yLabel,
  xDomain = [0, 100],
  yDomain = [0, 100],
  xTickFormatter,
  yTickFormatter,
  xTicks,
  yTicks,
  xScale = 'linear',
  yScale = 'linear',
  highlight = 'all',
  height = 360,
}) {
  // Draw the highlighted segment last so it sits on top.
  const ordered = highlight === 'all' ? SEGMENTS : [...SEGMENTS.filter((s) => s.id !== highlight), SEGMENT_BY_ID[highlight]]
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ScatterChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid stroke={CHART.grid} />
        <XAxis
          type="number"
          dataKey={x}
          domain={xDomain}
          ticks={xTicks}
          scale={xScale}
          tickFormatter={xTickFormatter}
          {...AXIS_PROPS}
          label={axisLabel(xLabel, { position: 'insideBottom', offset: -14 })}
        />
        <YAxis
          type="number"
          dataKey={y}
          domain={yDomain}
          ticks={yTicks}
          scale={yScale}
          allowDataOverflow
          tickFormatter={yTickFormatter}
          width={56}
          {...AXIS_PROPS}
          label={axisLabel(yLabel, { angle: -90, position: 'insideLeft', offset: 4 })}
        />
        <ZAxis range={[30, 30]} />
        <Tooltip content={<CustomerTooltip />} cursor={{ strokeDasharray: '3 3', stroke: CHART.cursor }} />
        {ordered.map((s) => {
          const dimmed = highlight !== 'all' && highlight !== s.id
          return (
            <Scatter
              key={s.id}
              name={s.short}
              data={customers.filter((c) => c.segment === s.id)}
              fill={s.color}
              fillOpacity={dimmed ? 0.1 : 0.72}
              stroke={CHART.surface}
              strokeWidth={0.75}
              isAnimationActive={false}
            />
          )
        })}
      </ScatterChart>
    </ResponsiveContainer>
  )
}
