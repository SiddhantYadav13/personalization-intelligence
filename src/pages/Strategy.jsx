import { Link } from 'react-router-dom'
import { ArrowRight, FlaskConical } from 'lucide-react'
import { analytics } from '../analytics/index.js'
import { Card, PageHeader, QuadrantBadge, SegmentDot } from '../components/ui.jsx'
import { formatCurrency, formatNumber, formatPercent } from '../utils/format.js'

const STRATEGIES = [
  {
    segment: 'loyalists',
    title: 'Prioritize High-Value Customers',
    description: 'Use personalized recommendations and cross-selling to deepen relationships with valuable customers.',
    tactics: ['Purchase-history recommendations', 'Cross-category bundles', 'Loyalty-tier offers and early access'],
  },
  {
    segment: 'potential',
    title: 'Re-engage High-Potential Customers',
    description: 'Target valuable customers whose engagement appears to be weakening.',
    tactics: ['Win-back journeys based on past categories', 'Targeted recommendations', 'Retention incentives for lapsing customers'],
  },
  {
    segment: 'emerging',
    title: 'Accelerate Second Purchases',
    description: 'Use complementary product recommendations and onboarding personalization for new customers, kept automated and low-cost while their value is unproven.',
    tactics: ['Post-purchase onboarding sequence', 'Complementary product suggestions', 'Time-bound second-order offer'],
  },
  {
    segment: 'low',
    title: 'Avoid Over-Personalization',
    description: 'Use lower-cost/general campaigns where customer value and personalization opportunity are both low.',
    tactics: ['Seasonal and broadcast campaigns', 'Rule-based (not 1:1) messaging', 'Monitor for reactivation signals'],
  },
]

function CoreInsight({ segments }) {
  const priority = segments.filter((s) => s.quadrant === 'prioritize')
  const low = segments.find((s) => s.id === 'low')
  const sum = (key) => priority.reduce((acc, s) => acc + s[key], 0)
  return (
    <section className="card-accent relative overflow-hidden rounded-2xl border px-8 py-10 md:px-12">
      <span className="absolute inset-y-0 left-0 w-[3px] bg-accent" aria-hidden="true" />
      <p className="eyebrow text-accent">Core insight</p>
      <div className="mt-4 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <h2 className="max-w-xl text-[26px] font-semibold leading-[1.25] tracking-[-0.025em] text-ink md:text-[30px]">
          Personalization should not necessarily be deployed uniformly across all customers.
        </h2>
        <div className="grid grid-cols-2 divide-x divide-line">
          <div className="pr-6">
            <p className="tabular text-[28px] font-medium leading-none tracking-[-0.03em] text-ink">
              {formatPercent(sum('customerShare'))} <span className="text-ink-3">→</span> {formatPercent(sum('revenueShare'))}
            </p>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-2">
              Customers in Prioritize segments vs their share of revenue
            </p>
          </div>
          <div className="pl-6">
            <p className="tabular text-[28px] font-medium leading-none tracking-[-0.03em] text-ink">
              {formatPercent(low.customerShare)} <span className="text-ink-3">→</span> {formatPercent(low.revenueShare)}
            </p>
            <p className="mt-3 text-[12px] leading-relaxed text-ink-2">Low-Engagement customers vs their share of revenue</p>
          </div>
        </div>
      </div>
    </section>
  )
}

function StrategyCard({ index, strategy, seg }) {
  return (
    <article
      className="card-accent card-accent-hover flex flex-col rounded-xl border p-6"
      style={{
        '--edge': `color-mix(in srgb, ${seg.color} 90%, transparent)`,
        '--edge-2': `color-mix(in srgb, ${seg.color} 40%, transparent)`,
      }}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line-2 pb-4">
        <span className="tabular text-[13px] font-semibold tracking-[0.04em] text-accent">{String(index + 1).padStart(2, '0')}</span>
        <QuadrantBadge quadrant={seg.quadrant} />
      </div>
      <h3 className="mt-5 min-h-[36px] text-[12.5px] font-semibold uppercase leading-snug tracking-[0.09em] text-ink">{strategy.title}</h3>
      <p className="mt-2.5 min-h-[92px] text-[13.5px] leading-relaxed text-ink-2">{strategy.description}</p>

      <div className="mt-5 flex items-center gap-2 text-[12.5px] font-medium text-ink">
        <SegmentDot color={seg.color} size={7} />
        {seg.name}
      </div>
      <dl className="mt-3 grid grid-cols-3 divide-x divide-line rounded-lg bg-canvas py-3">
        {[
          ['Customers', formatNumber(seg.count)],
          ['Revenue', formatPercent(seg.revenueShare)],
          ['Opp. score', Math.round(seg.opportunityScore)],
        ].map(([k, v]) => (
          <div key={k} className="px-3.5">
            <dt className="text-[10.5px] text-ink-3">{k}</dt>
            <dd className="tabular mt-0.5 text-[15px] font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <ul className="mt-6 flex-1 space-y-2.5">
        {strategy.tactics.map((t) => (
          <li key={t} className="flex gap-2.5 text-[12.5px] leading-snug text-ink-2">
            <span className="mt-[7px] h-px w-2 shrink-0 bg-ink-3" />
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-6 border-t border-line-2 pt-4 text-[11.5px] text-ink-3">
        <span title="Set by the segment's quadrant in the Personalization Opportunity Matrix">
          Personalization investment: <span className="font-medium text-ink">{seg.investment}</span>
        </span>
      </p>
    </article>
  )
}

export default function Strategy() {
  const { segments, kpis } = analytics
  const byId = Object.fromEntries(segments.map((s) => [s.id, s]))

  const metrics = [
    {
      name: 'Repeat purchase rate',
      definition: 'Share of customers with two or more orders.',
      baseline: formatPercent(kpis.repeatRate),
      focus: 'New / Emerging',
    },
    {
      name: 'Average order value',
      definition: 'Net revenue per order.',
      baseline: formatCurrency(kpis.aov),
      focus: 'Loyalists',
    },
    {
      name: 'Customer retention',
      definition: 'Share of customers who purchased in the last 12 months.',
      baseline: formatPercent(kpis.activeRate),
      focus: 'High-Potential',
    },
    {
      name: 'Conversion rate',
      definition: 'Share of targeted customers who purchase after a personalized touchpoint.',
      baseline: null,
      focus: 'All targeted segments',
    },
    {
      name: 'Customer lifetime value',
      definition: 'Expected long-term revenue per customer. Historical revenue per customer shown as a proxy.',
      baseline: formatCurrency(kpis.revenuePerCustomer),
      focus: 'Loyalists, High-Potential',
    },
  ]

  return (
    <div className="animate-fade-up space-y-6">
      <PageHeader
        eyebrow="Recommendations"
        title="Recommended Strategy"
        subtitle="Translate customer analytics into targeted actions."
      >
        <Link
          to="/opportunities"
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[13px] font-medium text-white backdrop-blur-sm transition-colors hover:border-white/30 hover:bg-white/[0.08] md:self-auto"
        >
          Review opportunity matrix <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </PageHeader>

      <CoreInsight segments={segments} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STRATEGIES.map((s, i) => (
          <StrategyCard key={s.segment} index={i} strategy={s} seg={byId[s.segment]} />
        ))}
      </div>

      <Card
        title="Measurement Framework"
        subtitle="Recommended KPIs for management to monitor when personalization initiatives are launched."
        bodyClassName="p-0"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-line bg-subtle text-left text-[10.5px] font-semibold uppercase tracking-[0.09em] text-ink-3">
                <th className="px-6 py-3">KPI</th>
                <th className="px-6 py-3">What it measures</th>
                <th className="px-6 py-3 text-right">Current baseline</th>
                <th className="px-6 py-3">Primary segment focus</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <tr key={m.name} className="border-b border-line-2 transition-colors duration-150 last:border-0 hover:bg-subtle">
                  <td className="whitespace-nowrap px-6 py-5 font-medium text-ink">{m.name}</td>
                  <td className="px-6 py-5 text-[13px] text-ink-2">{m.definition}</td>
                  <td className="tabular whitespace-nowrap px-6 py-5 text-right text-[15px] font-medium text-ink">
                    {m.baseline ?? <span className="text-[11.5px] font-normal text-ink-3">Needs campaign data</span>}
                  </td>
                  <td className="px-6 py-5 text-[13px] text-ink-2">{m.focus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3 rounded-b-xl border-t border-line bg-subtle px-6 py-5 text-[12.5px] leading-relaxed text-ink-2">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          <p>
            No personalization intervention has been run on this data, so no improvement is claimed. Baselines describe the current
            dataset; impact should be validated through controlled experiments (e.g. A/B tests with holdout groups) per
            segment.
          </p>
        </div>
      </Card>
    </div>
  )
}
