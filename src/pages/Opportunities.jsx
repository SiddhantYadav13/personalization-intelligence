import { useState } from 'react'
import { CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { analytics } from '../analytics/index.js'
import { SEGMENT_BY_ID } from '../analytics/segments.js'
import { QUADRANT_THRESHOLD, RECENCY_HORIZON_DAYS, WEIGHTS } from '../analytics/opportunity.js'
import { segmentRationale } from '../analytics/insights.js'
import {
  Card,
  ChartTooltipBox,
  InfoTooltip,
  PageHeader,
  QuadrantBadge,
  ScoreBar,
  SegmentDot,
  SegmentFilter,
  TooltipRow,
} from '../components/ui.jsx'
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js'
import { AXIS_PROPS, CHART, axisLabel } from '../components/chartTheme.js'
import { stratifiedSample } from '../utils/sample.js'

const plotCustomers = stratifiedSample(analytics.customers)

const QUADRANT_AREAS = [
  { x1: QUADRANT_THRESHOLD, x2: 100, y1: QUADRANT_THRESHOLD, y2: 100, label: 'PRIORITIZE', position: 'insideBottomRight', fill: '#f4f4fe', ink: '#4f46e5' },
  { x1: 0, x2: QUADRANT_THRESHOLD, y1: QUADRANT_THRESHOLD, y2: 100, label: 'MAINTAIN', position: 'insideTopLeft', fill: '#fafbfc', ink: '#8b95a5' },
  { x1: QUADRANT_THRESHOLD, x2: 100, y1: 0, y2: QUADRANT_THRESHOLD, label: 'TEST', position: 'insideBottomRight', fill: '#fafbfc', ink: '#8b95a5' },
  { x1: 0, x2: QUADRANT_THRESHOLD, y1: 0, y2: QUADRANT_THRESHOLD, label: 'DEPRIORITIZE', position: 'insideBottomLeft', fill: '#ffffff', ink: '#8b95a5' },
]

function ScoreExplainer() {
  return (
    <>
      <p className="font-semibold text-ink">Personalization Opportunity Score (0–100)</p>
      <p className="mt-1">
        A prioritization framework combining {WEIGHTS.value * 100}% Customer Value, {WEIGHTS.engagement * 100}% Engagement and{' '}
        {WEIGHTS.growth * 100}% Growth Potential.
      </p>
      <p className="mt-2">
        It ranks where personalization has the greatest <em>potential</em> value. It is a business hypothesis to test, not a
        prediction of revenue or ROI.
      </p>
    </>
  )
}

function MatrixTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  if (d.isSegment) {
    return (
      <ChartTooltipBox>
        <div className="mb-2 flex items-center gap-2 border-b border-line-2 pb-2 font-semibold text-ink">
          <SegmentDot color={d.color} size={8} /> {d.name}
        </div>
        <TooltipRow label="Customers" value={formatNumber(d.count)} />
        <TooltipRow label="Opportunity score" value={Math.round(d.opportunityScore)} />
        <TooltipRow label="Customer value" value={Math.round(d.valueScore)} />
        <TooltipRow label="Engagement" value={Math.round(d.engagementScore)} />
        <p className="mt-2 text-[11px] text-accent">Click to view details</p>
      </ChartTooltipBox>
    )
  }
  return (
    <ChartTooltipBox>
      <div className="mb-2 flex items-center gap-2 border-b border-line-2 pb-2 font-semibold text-ink">
        <SegmentDot color={SEGMENT_BY_ID[d.segment].color} size={8} /> {d.customerId}
      </div>
      <TooltipRow label="Segment" value={SEGMENT_BY_ID[d.segment].short} />
      <TooltipRow label="Opportunity score" value={Math.round(d.opportunityScore)} />
      <TooltipRow label="Customer value" value={Math.round(d.valueScore)} />
      <TooltipRow label="Total spend" value={formatCurrency(d.monetary)} />
    </ChartTooltipBox>
  )
}

function makeBubble(selected, maxCount) {
  return function Bubble({ cx, cy, payload }) {
    const r = 12 + 22 * Math.sqrt(payload.count / maxCount)
    const isSelected = payload.id === selected
    return (
      <g style={{ cursor: 'pointer' }}>
        {isSelected && <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke={CHART.ink} strokeOpacity={0.55} strokeWidth={1.25} />}
        <circle cx={cx} cy={cy} r={r} fill={payload.color} fillOpacity={0.88} stroke={CHART.surface} strokeWidth={2} />
        <text x={cx + r + 9} y={cy - 2} fontSize={12} fontWeight={600} fill={CHART.ink} letterSpacing={-0.1}>
          {payload.short}
        </text>
        <text x={cx + r + 9} y={cy + 13} fontSize={11} fill={CHART.muted}>
          Score {Math.round(payload.opportunityScore)}
        </text>
      </g>
    )
  }
}

function OpportunityMatrix({ customers, segments, selected, onSelect }) {
  const maxCount = Math.max(...segments.map((s) => s.count))
  const bubbles = segments.map((s) => ({ ...s, isSegment: true }))
  return (
    <ResponsiveContainer width="100%" height={460}>
      <ScatterChart margin={{ top: 10, right: 24, bottom: 28, left: 8 }}>
        {QUADRANT_AREAS.map((q) => (
          <ReferenceArea
            key={q.label}
            x1={q.x1}
            x2={q.x2}
            y1={q.y1}
            y2={q.y2}
            fill={q.fill}
            fillOpacity={1}
            stroke="none"
            label={{ value: q.label, position: q.position, fill: q.ink, fontSize: 10, fontWeight: 600, letterSpacing: 1.6, offset: 14 }}
          />
        ))}
        <CartesianGrid stroke={CHART.grid} strokeDasharray="0" fill="transparent" />
        <ReferenceLine x={QUADRANT_THRESHOLD} stroke="#c3c8d1" strokeDasharray="3 4" />
        <ReferenceLine y={QUADRANT_THRESHOLD} stroke="#c3c8d1" strokeDasharray="3 4" />
        <XAxis
          type="number"
          dataKey="opportunityScore"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          {...AXIS_PROPS}
          label={axisLabel('Personalization Opportunity →', { position: 'insideBottom', offset: -16 })}
        />
        <YAxis
          type="number"
          dataKey="valueScore"
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          width={48}
          {...AXIS_PROPS}
          label={axisLabel('Customer Value →', { angle: -90, position: 'insideLeft' })}
        />
        <ZAxis zAxisId="customers" range={[16, 16]} />
        <ZAxis zAxisId="segments" range={[400, 400]} />
        <Tooltip content={<MatrixTooltip />} cursor={false} />
        <Scatter
          zAxisId="customers"
          data={customers}
          isAnimationActive={false}
          shape={({ cx, cy, payload }) => (
            <circle
              cx={cx}
              cy={cy}
              r={2.4}
              fill={SEGMENT_BY_ID[payload.segment].color}
              fillOpacity={payload.segment === selected ? 0.5 : 0.15}
            />
          )}
        />
        <Scatter
          zAxisId="segments"
          data={bubbles}
          isAnimationActive={false}
          shape={makeBubble(selected, maxCount)}
          onClick={(d) => onSelect(d?.payload?.id ?? d?.id)}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

function SegmentPanel({ seg, kpis }) {
  return (
    <div key={seg.id} className="animate-fade-up space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <SegmentDot color={seg.color} size={9} />
          <h3 className="text-[15.5px] font-semibold tracking-[-0.015em] text-ink">{seg.name}</h3>
          <QuadrantBadge quadrant={seg.quadrant} />
        </div>
        <p className="mt-1.5 text-[12.5px] text-ink-3">
          {formatNumber(seg.count)} customers · {formatPercent(seg.revenueShare)} of revenue
        </p>
      </div>

      <div className="rounded-lg border border-line bg-subtle p-5">
        <div className="flex items-baseline justify-between border-b border-line pb-4">
          <span className="eyebrow !text-[10.5px] text-ink-3">Opportunity score</span>
          <span className="tabular text-[34px] font-medium leading-none tracking-[-0.035em] text-ink">{Math.round(seg.opportunityScore)}</span>
        </div>
        <div className="mt-4 space-y-3.5 text-[12.5px]">
          {[
            ['Customer value', seg.valueScore, `${WEIGHTS.value * 100}%`],
            ['Engagement', seg.engagementScore, `${WEIGHTS.engagement * 100}%`],
            ['Growth potential', seg.growthScore, `${WEIGHTS.growth * 100}%`],
          ].map(([label, v, w]) => (
            <div key={label}>
              <div className="mb-1.5 flex justify-between text-ink-2">
                <span>{label}</span>
                <span className="tabular text-[11.5px] text-ink-3">weight {w}</span>
              </div>
              <ScoreBar value={v} color={seg.id === 'low' ? '#a8a6a0' : seg.color} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow !text-[10.5px] text-ink-3">Why this segment matters</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{segmentRationale(seg, kpis)}</p>
      </div>
      <div className="border-t border-line-2 pt-5">
        <p className="eyebrow !text-[10.5px] text-ink-3">Recommended intervention</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{seg.intervention}</p>
      </div>
      <div className="border-t border-line-2 pt-5">
        <p className="eyebrow !text-[10.5px] text-ink-3">Business objective</p>
        <p className="mt-2 text-[13.5px] font-medium text-ink">{seg.objective}</p>
      </div>
    </div>
  )
}

function ComponentDefinitions({ frequencyNote }) {
  const items = [
    {
      title: 'Customer Value',
      weight: WEIGHTS.value,
      body: 'Percentile rank of total customer spend across the customer base.',
    },
    {
      title: 'Engagement',
      weight: WEIGHTS.engagement,
      body: `50% recency (linear decay to zero at ${RECENCY_HORIZON_DAYS} days) and 50% order frequency (${frequencyNote}).`,
    },
    {
      title: 'Growth Potential',
      weight: WEIGHTS.growth,
      body: `60% spend per order (AOV percentile) and 40% cross-sell headroom (categories not yet bought). Halved if no purchase in ${RECENCY_HORIZON_DAYS} days.`,
    },
  ]
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {items.map((i) => (
        <div key={i.title} className="border-t-2 border-ink pt-3.5">
          <div className="flex items-baseline justify-between">
            <p className="text-[13.5px] font-semibold text-ink">{i.title}</p>
            <span className="tabular text-[12px] font-semibold text-accent">{i.weight * 100}%</span>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-2">{i.body}</p>
        </div>
      ))}
    </div>
  )
}

export default function Opportunities() {
  const { segments, kpis } = analytics
  const ranked = [...segments].sort((a, b) => b.opportunityScore - a.opportunityScore)
  const [selected, setSelected] = useState(ranked[0].id)
  const seg = segments.find((s) => s.id === selected)

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        eyebrow="Prioritization"
        title="Personalization Opportunities"
        subtitle="Prioritize customers where personalization has the strongest potential business value."
      />

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card
          variant="chart"
          title={
            <span className="flex items-center gap-1.5">
              Personalization Opportunity Matrix
              <InfoTooltip label="About the opportunity score" align="left">
                <ScoreExplainer />
              </InfoTooltip>
            </span>
          }
          subtitle={`Bubbles are segments (size = customers); faint dots are a stratified sample of ${formatNumber(
            plotCustomers.length,
          )} customers. Click a bubble to inspect it.`}
        >
          <OpportunityMatrix customers={plotCustomers} segments={segments} selected={selected} onSelect={setSelected} />
          <p className="mt-2 text-[11.5px] text-ink-3">
            Quadrants split at {QUADRANT_THRESHOLD} on both axes. Customer value is a spend percentile, so 50 = median customer.
          </p>
          <div className="mt-6 border-t border-line-2 pt-6">
            <p className="mb-5 text-[13px] font-semibold text-ink">
              Opportunity = 40% Customer Value + 30% Engagement + 30% Growth Potential
              <span className="ml-2 font-normal text-ink-3">each component scaled 0–100</span>
            </p>
            <ComponentDefinitions frequencyNote="capped at the 95th percentile of orders per customer" />
            <p className="mt-5 text-[11.5px] leading-relaxed text-ink-3">
              A transparent prioritization framework, not a scientifically validated or industry-standard metric. It identifies
              where personalization has the greatest potential opportunity; expected impact is a business hypothesis to validate
              through controlled tests.
            </p>
          </div>
        </Card>

        <Card title="Segment detail" subtitle="Select a segment">
          <div className="mb-6">
            <SegmentFilter value={selected} onChange={setSelected} includeAll={false} />
          </div>
          <SegmentPanel seg={seg} kpis={kpis} />
        </Card>
      </div>

      <Card title="Top Personalization Opportunities" subtitle="Segments ranked by average Personalization Opportunity Score" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle text-left text-[10.5px] font-semibold uppercase tracking-[0.09em] whitespace-nowrap text-ink-3">
                <th className="px-6 py-3 w-12">Rank</th>
                <th className="px-6 py-3">Segment</th>
                <th className="px-6 py-3 w-56">Opportunity score</th>
                <th className="px-6 py-3 text-right">Customer value</th>
                <th className="px-6 py-3 text-right">Engagement</th>
                <th className="px-6 py-3">Quadrant</th>
                <th className="px-6 py-3">Recommended action</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s, i) => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={`cursor-pointer border-b border-line-2 transition-colors duration-150 last:border-0 ${
                    selected === s.id ? 'bg-[#f8f8fe] shadow-[inset_2px_0_0_#4f46e5]' : 'hover:bg-subtle'
                  }`}
                >
                  <td className="tabular px-6 py-5 text-[12px] font-semibold text-ink-3">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 whitespace-nowrap font-medium text-ink">
                      <SegmentDot color={s.color} size={7} />
                      {s.name}
                    </div>
                    <p className="ml-[15px] mt-0.5 text-[11.5px] text-ink-3">{formatNumber(s.count)} customers</p>
                  </td>
                  <td className="px-6 py-5">
                    <ScoreBar value={s.opportunityScore} color="#4f46e5" />
                  </td>
                  <td className="tabular px-6 py-5 text-right text-ink">{Math.round(s.valueScore)}</td>
                  <td className="tabular px-6 py-5 text-right text-ink">{Math.round(s.engagementScore)}</td>
                  <td className="px-6 py-5">
                    <QuadrantBadge quadrant={s.quadrant} />
                  </td>
                  <td className="px-6 py-5 text-[13px] text-ink-2">{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
