import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb, X } from 'lucide-react'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { analytics } from '../analytics/index.js'
import { FREQUENCY_BANDS, RECENCY_BANDS } from '../analytics/rfm.js'
import { Card, ChartTooltipBox, PageHeader, QuadrantBadge, SegmentDot, SegmentFilter, SegmentLegend, Stat, TooltipRow } from '../components/ui.jsx'
import CustomerScatter from '../components/CustomerScatter.jsx'
import { CHART } from '../components/chartTheme.js'
import { stratifiedSample } from '../utils/sample.js'

const plotCustomers = stratifiedSample(analytics.customers)
import { formatCurrency, formatCurrencyCompact, formatDecimal, formatNumber, formatPercent } from '../utils/format.js'

// Accent border tinted with the segment's own colour.
const segmentEdge = (color) => ({
  '--edge': `color-mix(in srgb, ${color} 90%, transparent)`,
  '--edge-2': `color-mix(in srgb, ${color} 40%, transparent)`,
})

function SegmentCard({ seg, selected, dimmed, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`card-accent card-accent-hover group flex flex-col rounded-xl border p-6 text-left ${
        selected ? 'is-selected' : ''
      } ${dimmed ? 'opacity-50 hover:opacity-100' : ''}`}
      style={segmentEdge(seg.color)}
    >
      <div className="flex items-center gap-2">
        <SegmentDot color={seg.color} size={8} />
        <h3 className="text-[14.5px] font-semibold tracking-[-0.01em] text-ink">{seg.name}</h3>
      </div>
      <p className="mt-2 min-h-[40px] text-[12.5px] leading-snug text-ink-2">{seg.profile}</p>

      <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 border-t border-line-2 pt-5">
        <Stat label="Customers" value={formatNumber(seg.count)} sub={`${formatPercent(seg.customerShare)} of base`} />
        <Stat label="Revenue share" value={formatPercent(seg.revenueShare)} sub={formatCurrencyCompact(seg.revenue)} />
        <Stat label="Avg order value" value={formatCurrency(seg.aov)} />
        <Stat label="Avg frequency" value={`${formatDecimal(seg.avgFrequency)} orders`} />
      </div>

      <div className="mt-5 rounded-lg bg-canvas px-3.5 py-3">
        <p className="eyebrow !text-[10px] text-ink-3">Recommended action</p>
        <p className="mt-1 text-[13px] font-medium text-ink">{seg.action}</p>
      </div>
      <span className="mt-3 text-[12px] font-medium text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        {selected ? 'Selected' : 'View segment details →'}
      </span>
    </button>
  )
}

function SegmentDetail({ seg, onClose }) {
  return (
    <Card className="animate-fade-up" bodyClassName="p-0">
      <div className="flex flex-col gap-4 border-b border-line-2 px-7 py-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <SegmentDot color={seg.color} size={10} />
            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-ink">{seg.name}</h2>
            <QuadrantBadge quadrant={seg.quadrant} />
          </div>
          <p className="mt-1.5 text-[13.5px] text-ink-2">{seg.profile}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 self-start rounded-md border border-line bg-white px-2.5 py-1.5 text-[12px] font-medium text-ink-2 transition-colors hover:border-[#cfd3da] hover:text-ink"
        >
          <X className="h-3.5 w-3.5" /> Show all segments
        </button>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_380px]">
        <div className="grid grid-cols-2 gap-x-6 gap-y-7 px-7 py-7 md:grid-cols-4">
          <Stat label="Customers" value={formatNumber(seg.count)} sub={`${formatPercent(seg.customerShare)} of customers`} />
          <Stat label="Revenue" value={formatCurrencyCompact(seg.revenue)} sub={`${formatPercent(seg.revenueShare)} of total`} />
          <Stat label="Avg order value" value={formatCurrency(seg.aov)} />
          <Stat label="Avg spend / customer" value={formatCurrency(seg.avgMonetary)} />
          <Stat label="Avg orders" value={formatDecimal(seg.avgFrequency)} />
          <Stat label="Avg days since last order" value={formatNumber(seg.avgRecency)} />
          <Stat label="Avg categories bought" value={formatDecimal(seg.avgCategories)} sub={`of ${analytics.kpis.totalCategories} categories`} />
          <Stat label="Avg opportunity score" value={Math.round(seg.opportunityScore)} sub="0–100 scale" />
          <div className="col-span-2 md:col-span-4">
            <p className="text-[11.5px] text-ink-3">Segment rule (RFM scores 1–5)</p>
            <p className="mt-1.5 inline-block rounded-md bg-canvas px-2.5 py-1 font-mono text-[11.5px] text-ink ring-1 ring-inset ring-line">{seg.rule}</p>
          </div>
        </div>

        <div className="border-t border-line-2 bg-subtle px-7 py-7 lg:rounded-br-xl lg:border-t-0 lg:border-l">
          <div className="eyebrow flex items-center gap-2 !text-[10.5px] text-ink-3">
            <Lightbulb className="h-3.5 w-3.5 text-accent" /> Recommended action
          </div>
          <p className="mt-3 text-[15px] font-semibold tracking-[-0.01em] text-ink">{seg.action}</p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{seg.intervention}</p>
          <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-[13px]">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Business objective</dt>
              <dd className="text-right font-medium text-ink">{seg.objective}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-3">Personalization investment</dt>
              <dd className="font-medium text-ink">{seg.investment}</dd>
            </div>
          </dl>
          <Link to="/opportunities" className="mt-6 inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors hover:text-[#3730a3]">
            See opportunity analysis <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  )
}

function ScoringRules() {
  return (
    <Card title="How segments are defined" subtitle="Transparent rules on RFM scores. Rules are applied in order; the first match wins.">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <ol className="divide-y divide-line-2">
          {analytics.segments.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 py-3 text-[13.5px] first:pt-0 last:pb-0">
              <span className="tabular w-5 text-[11px] font-semibold text-accent">{String(i + 1).padStart(2, '0')}</span>
              <SegmentDot color={s.color} size={7} />
              <div>
                <span className="font-medium text-ink">{s.name}</span>
                <span className="ml-2.5 rounded-md bg-canvas px-1.5 py-0.5 font-mono text-[11px] text-ink-2 ring-1 ring-inset ring-line">{s.rule}</span>
              </div>
            </li>
          ))}
        </ol>
        <div className="grid grid-cols-3 gap-6 border-line-2 text-[12px] lg:border-l lg:pl-8">
          <div>
            <p className="mb-2.5 font-semibold text-ink">Recency (R)</p>
            {RECENCY_BANDS.map((b) => (
              <p key={b.score} className="tabular py-0.5 text-ink-2">
                <span className="font-semibold text-ink">{b.score}</span> · {b.label}
              </p>
            ))}
          </div>
          <div>
            <p className="mb-2.5 font-semibold text-ink">Frequency (F)</p>
            {FREQUENCY_BANDS.map((b) => (
              <p key={b.score} className="tabular py-0.5 text-ink-2">
                <span className="font-semibold text-ink">{b.score}</span> · {b.label}
              </p>
            ))}
          </div>
          <div>
            <p className="mb-2.5 font-semibold text-ink">Monetary (M)</p>
            <p className="leading-relaxed text-ink-2">Quintiles of total customer spend: 5 = top 20%, 1 = bottom 20%.</p>
          </div>
        </div>
      </div>
    </Card>
  )
}

function SegmentBarChart({ data, dataKey, formatter, selected, tooltipLabel }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 0 }} barCategoryGap={10}>
        <XAxis type="number" hide domain={[0, 'dataMax']} />
        <YAxis type="category" dataKey="short" width={124} tickLine={false} axisLine={false} tick={{ fill: CHART.muted, fontSize: 12 }} />
        <Tooltip
          cursor={{ fill: '#f7f8fa' }}
          content={({ active, payload }) =>
            active && payload?.length ? (
              <ChartTooltipBox>
                <p className="mb-1 font-semibold text-ink">{payload[0].payload.name}</p>
                <TooltipRow label={tooltipLabel} value={formatter(payload[0].value)} />
              </ChartTooltipBox>
            ) : null
          }
        />
        <Bar dataKey={dataKey} radius={[0, 3, 3, 0]} barSize={22} isAnimationActive={false}>
          {data.map((s) => (
            <Cell key={s.id} fill={s.color} fillOpacity={selected === 'all' || selected === s.id ? 0.9 : 0.18} />
          ))}
          <LabelList dataKey={dataKey} position="right" offset={10} formatter={formatter} style={{ fill: CHART.ink, fontSize: 12, fontWeight: 500 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

const X_OPTIONS = {
  recency: { key: 'recency', label: 'Days since last order', domain: [0, 'dataMax'], ticks: [0, 90, 180, 365, 540, 730] },
  frequency: { key: 'frequency', label: 'Number of orders' },
}

export default function Segments() {
  const { segments, customers } = analytics
  const [selected, setSelected] = useState('all')
  const [xAxis, setXAxis] = useState('recency')
  const selectedSeg = segments.find((s) => s.id === selected)
  const visibleCustomers = selected === 'all' ? customers : customers.filter((c) => c.segment === selected)
  // Log axis bounds snapped to powers of ten (a log scale cannot include 0).
  const spendTicks = []
  const spend = customers.map((c) => c.monetary)
  const lo = Math.floor(Math.log10(spend.reduce((a, b) => Math.min(a, b), Infinity)))
  const hi = Math.ceil(Math.log10(spend.reduce((a, b) => Math.max(a, b), -Infinity)))
  for (let p = lo; p <= hi; p++) spendTicks.push(10 ** p)
  const maxOrders = customers.reduce((m, c) => Math.max(m, c.frequency), 0)
  const frequencyTicks = Array.from({ length: Math.ceil(maxOrders / 2) + 1 }, (_, i) => i * 2)

  return (
    <div className="animate-fade-up space-y-5">
      <PageHeader
        eyebrow="Segmentation"
        title="Customer Segments"
        subtitle="Understand who your customers are before deciding how to personalize."
      >
        <SegmentFilter value={selected} onChange={setSelected} tone="dark" />
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {segments.map((s) => (
          <SegmentCard
            key={s.id}
            seg={s}
            selected={selected === s.id}
            dimmed={selected !== 'all' && selected !== s.id}
            onSelect={() => setSelected(selected === s.id ? 'all' : s.id)}
          />
        ))}
      </div>

      {selectedSeg ? <SegmentDetail key={selectedSeg.id} seg={selectedSeg} onClose={() => setSelected('all')} /> : <ScoringRules />}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card variant="chart" title="Customer distribution by segment" subtitle="Number of customers">
          <SegmentBarChart data={segments} dataKey="count" formatter={formatNumber} selected={selected} tooltipLabel="Customers" />
        </Card>
        <Card variant="chart" title="Revenue contribution by segment" subtitle="Share of total revenue">
          <SegmentBarChart
            data={segments}
            dataKey="revenueShare"
            formatter={(v) => formatPercent(v)}
            selected={selected}
            tooltipLabel="Revenue share"
          />
        </Card>
      </div>

      <Card
        variant="chart"
        title={`Customer Value vs ${xAxis === 'recency' ? 'Recency' : 'Frequency'}`}
        subtitle={`${formatNumber(visibleCustomers.length)} customers ${
          selected === 'all' ? 'in total' : 'highlighted'
        } · stratified sample of ${formatNumber(plotCustomers.length)} plotted · total spend on a log scale`}
        action={
          <div className="inline-flex gap-0.5 rounded-lg bg-[#eef0f3] p-[3px]" role="tablist" aria-label="X axis">
            {Object.entries({ recency: 'Recency', frequency: 'Frequency' }).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={xAxis === k}
                onClick={() => setXAxis(k)}
                className={`rounded-md px-3 py-1 text-[12px] font-medium transition-all duration-150 ${
                  xAxis === k
                    ? 'bg-white text-ink shadow-[0_1px_2px_rgba(17,24,39,0.08),0_0_0_1px_rgba(17,24,39,0.04)]'
                    : 'text-ink-2 hover:text-ink'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        <div className="mb-3 flex justify-end">
          <SegmentLegend />
        </div>
        <CustomerScatter
          customers={plotCustomers}
          highlight={selected}
          x={X_OPTIONS[xAxis].key}
          y="monetary"
          xLabel={X_OPTIONS[xAxis].label}
          yLabel="Total spend"
          xDomain={xAxis === 'frequency' ? [0, frequencyTicks[frequencyTicks.length - 1]] : X_OPTIONS[xAxis].domain}
          xTicks={xAxis === 'frequency' ? frequencyTicks : X_OPTIONS[xAxis].ticks}
          yDomain={[spendTicks[0], spendTicks[spendTicks.length - 1]]}
          yTicks={spendTicks}
          yScale="log"
          yTickFormatter={formatCurrencyCompact}
          height={380}
        />
      </Card>
    </div>
  )
}
