import { Link } from 'react-router-dom'
import { ArrowRight, Repeat, ShoppingBag, Target, Users, Wallet } from 'lucide-react'
import { analytics } from '../analytics/index.js'
import { Band, Card, SegmentDot, SegmentLegend } from '../components/ui.jsx'
import CustomerScatter from '../components/CustomerScatter.jsx'
import { formatCurrency, formatCurrencyCompact, formatDate, formatNumber, formatPercent } from '../utils/format.js'
import { stratifiedSample } from '../utils/sample.js'

const plotCustomers = stratifiedSample(analytics.customers)

function Hero({ kpis, meta }) {
  return (
    <Band intensity={1}>
      <div className="grid items-center gap-12 pt-20 pb-24 lg:grid-cols-[1fr_340px] lg:pt-24 lg:pb-28">
        <div>
          <p className="eyebrow mb-6 text-[#a5b4fc]">From customer behavior to personalization strategy</p>
          <h1 className="max-w-3xl text-[44px] font-semibold leading-[1.04] tracking-[-0.035em] text-white md:text-[60px]">
            Turn Customer Data Into <span className="text-spectrum">Personalization Decisions</span>
          </h1>
          <p className="mt-7 max-w-lg text-[17px] leading-relaxed text-[#a3adbf]">
            Identify where targeted personalization can create the greatest customer and business value.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/opportunities"
              className="group inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-[14px] font-medium text-ink shadow-[0_10px_30px_-10px_rgba(143,176,255,0.55)] transition-all duration-200 hover:bg-[#eef1ff]"
            >
              Explore Opportunities
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/segments"
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-5 py-3 text-[14px] font-medium text-white backdrop-blur-sm transition-colors duration-200 hover:border-white/30 hover:bg-white/[0.08]"
            >
              View Customer Segments
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0d1224]/60 p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)] backdrop-blur-md">
          <p className="eyebrow text-[#8590a6]">Dataset</p>
          <dl className="mt-5 space-y-3.5 text-[13px]">
            {[
              ['Line items (cleaned)', formatNumber(kpis.transactionRows)],
              ['Orders', formatNumber(kpis.totalOrders)],
              ['Customers', formatNumber(kpis.totalCustomers)],
              ['Product categories', kpis.totalCategories],
              ['Period', `${formatDate(kpis.startDate)} – ${formatDate(kpis.endDate)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-white/[0.07] pb-3.5 last:border-0 last:pb-0">
                <dt className="text-[#9aa4b8]">{k}</dt>
                <dd className="tabular text-right font-medium text-white">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 border-t border-white/[0.07] pt-4 text-[11.5px] leading-relaxed text-[#8590a6]">
            Real transactions from a UK online gift retailer —{' '}
            <a href={meta.url} target="_blank" rel="noopener noreferrer" className="text-[#c7d2fe] underline decoration-white/20 underline-offset-2 hover:text-white">
              {meta.publisher.replace(' Machine Learning Repository', '')} {meta.name}
            </a>{' '}
            ({meta.license}). Product categories derived from item descriptions.
          </p>
        </div>
      </div>
    </Band>
  )
}

function KpiCard({ icon: Icon, label, value, sub, emphasis }) {
  return (
    <div className="card-accent card-accent-hover relative overflow-hidden rounded-xl border p-5">
      {emphasis && <span className="absolute inset-x-0 top-0 h-[2px] bg-accent" aria-hidden="true" />}
      <div className="flex items-start gap-2 text-[12.5px] font-medium leading-snug text-ink-2">
        <Icon className={`mt-px h-3.5 w-3.5 shrink-0 ${emphasis ? 'text-accent' : 'text-ink-3'}`} strokeWidth={2} />
        {label}
      </div>
      <p className="tabular mt-4 text-[30px] font-medium leading-none tracking-[-0.03em] text-ink">{value}</p>
      <p className="mt-2.5 text-[11.5px] leading-snug text-ink-3">{sub}</p>
    </div>
  )
}

function ShareComparison({ segments }) {
  return (
    <div className="space-y-6">
      {segments.map((s) => (
        <div key={s.id}>
          <div className="mb-2.5 flex items-center gap-2 text-[13px] font-medium text-ink">
            <SegmentDot color={s.color} size={7} />
            {s.short}
          </div>
          {[
            ['Customers', s.customerShare, '#d9dde3'],
            ['Revenue', s.revenueShare, s.id === 'low' ? '#a8a6a0' : s.color],
          ].map(([label, v, color]) => (
            <div key={label} className="mb-1.5 flex items-center gap-3 text-[11.5px]">
              <span className="w-16 text-ink-3">{label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line-2">
                <div className="h-full rounded-full" style={{ width: `${v * 100}%`, background: color }} />
              </div>
              <span className="tabular w-9 text-right font-medium text-ink">{formatPercent(v)}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function Overview() {
  const { kpis, insights, segments, meta } = analytics

  const kpiCards = [
    { icon: Users, label: 'Total Customers', value: formatNumber(kpis.totalCustomers), sub: 'Unique customers with ≥ 1 order' },
    { icon: Wallet, label: 'Total Revenue', value: formatCurrencyCompact(kpis.totalRevenue), sub: `Excl. cancellations · ${formatNumber(kpis.totalOrders)} orders` },
    { icon: ShoppingBag, label: 'Average Order Value', value: formatCurrency(kpis.aov), sub: 'Revenue per order' },
    { icon: Repeat, label: 'Repeat Purchase Rate', value: formatPercent(kpis.repeatRate), sub: 'Customers with 2+ orders' },
    {
      icon: Target,
      label: 'High-Opportunity Customers',
      value: formatNumber(kpis.highOpportunityCount),
      sub: `${formatPercent(kpis.highOpportunityShare)} of customers in the Prioritize quadrant`,
      emphasis: true,
    },
  ]

  return (
    <div className="animate-fade-up space-y-14">
      <Hero kpis={kpis} meta={meta} />

      <section className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {kpiCards.map((k) => (
          <KpiCard key={k.label} {...k} />
        ))}
      </section>

      <section>
        <div className="mb-6 flex items-end justify-between gap-4 border-b border-line pb-4">
          <div>
            <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-ink">Executive Snapshot</h2>
            <p className="mt-1 text-[13px] text-ink-2">Key findings calculated from the transaction data.</p>
          </div>
          <Link
            to="/strategy"
            className="hidden items-center gap-1 text-[13px] font-medium text-accent transition-colors hover:text-[#3730a3] sm:flex"
          >
            See recommended strategy <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {insights.map((i, idx) => (
            <article key={i.id} className="card-accent card-accent-hover flex flex-col rounded-xl border p-6">
              <span className="tabular text-[11px] font-semibold tracking-[0.08em] text-accent">{String(idx + 1).padStart(2, '0')}</span>
              <p className="tabular mt-4 text-[34px] font-medium leading-none tracking-[-0.035em] text-ink">{i.metric}</p>
              <p className="mt-3 text-[13.5px] font-medium leading-snug text-ink">{i.title}</p>
              <p className="mt-4 border-t border-line-2 pt-4 text-[12.5px] leading-relaxed text-ink-2">{i.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card
          variant="chart"
          className="lg:col-span-2"
          title="Customer Value vs Engagement"
          subtitle={`Each dot is a customer (stratified sample of ${formatNumber(plotCustomers.length)} of ${formatNumber(
            kpis.totalCustomers,
          )}). Scores are 0–100 (value = spend percentile; engagement = recency + frequency).`}
          action={<SegmentLegend />}
        >
          <CustomerScatter
            customers={plotCustomers}
            x="engagementScore"
            y="valueScore"
            xLabel="Engagement score"
            yLabel="Customer value score"
            height={380}
          />
        </Card>
        <Card variant="chart" title="Customer Share vs Revenue Share" subtitle="Value is concentrated in a minority of customers.">
          <ShareComparison segments={segments} />
          <Link
            to="/segments"
            className="mt-7 inline-flex items-center gap-1 text-[13px] font-medium text-accent transition-colors hover:text-[#3730a3]"
          >
            Explore segments <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      </section>
    </div>
  )
}
