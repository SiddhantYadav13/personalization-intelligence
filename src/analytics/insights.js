// Generates plain-language findings from the computed metrics.
// Every number in these sentences comes from the dataset.

import { formatCurrency, formatCurrencyCompact, formatNumber, formatPercent } from '../utils/format.js'

const byId = (segments) => Object.fromEntries(segments.map((s) => [s.id, s]))

export function generateInsights(kpis, segments) {
  const s = byId(segments)
  const topRevenue = [...segments].sort((a, b) => b.revenueShare - a.revenueShare)[0]
  const topAov = [...segments].sort((a, b) => b.aov - a.aov)[0]
  const priority = segments.filter((x) => x.quadrant === 'prioritize')
  const sum = (key) => priority.reduce((acc, x) => acc + x[key], 0)

  // When the only Prioritize segment is also the top revenue segment, the
  // concentration card below already says this — show the low-value contrast instead.
  const priorityIsTopOnly = priority.length === 1 && priority[0].id === topRevenue.id
  const first = priorityIsTopOnly
    ? {
        id: 'low-value-tail',
        metric: formatPercent(s.low.customerShare),
        title: `of customers generate only ${formatPercent(s.low.revenueShare)} of revenue`,
        detail: `${formatNumber(s.low.count)} Low-Engagement customers — where costly 1:1 personalization is hardest to justify.`,
      }
    : {
        id: 'high-opportunity',
        metric: formatPercent(sum('customerShare')),
        title: `of customers generate ${formatPercent(sum('revenueShare'))} of revenue`,
        detail: `${priority.map((x) => x.short).join(' and ')} — the ${formatNumber(
          sum('count'),
        )} customers in segments the opportunity matrix places in Prioritize.`,
      }

  return [
    first,
    {
      id: 'revenue-concentration',
      metric: formatPercent(topRevenue.revenueShare),
      title: `of revenue comes from ${topRevenue.name}`,
      detail: `They are only ${formatPercent(topRevenue.customerShare)} of the customer base (${formatNumber(topRevenue.count)} customers).`,
    },
    {
      id: 'value-at-risk',
      metric: formatNumber(s.potential.lapsedCount),
      title: 'customers show strong value but declining engagement',
      detail: `High-Potential customers with no purchase in 180+ days — candidates for targeted re-engagement.`,
    },
    {
      id: 'aov-leader',
      metric: formatCurrency(topAov.aov),
      title: `average order value among ${topAov.name}`,
      detail: `Compared with ${formatCurrency(kpis.aov)} across all customers (${formatPercent(topAov.aov / kpis.aov - 1)} higher).`,
    },
  ]
}

// Segment-specific rationale used on the Opportunities page.
export function segmentRationale(seg, kpis) {
  const share = `${formatPercent(seg.customerShare)} of customers and ${formatPercent(seg.revenueShare)} of revenue`
  switch (seg.id) {
    case 'loyalists':
      return `${share}. Average spend of ${formatCurrencyCompact(seg.avgMonetary)} per customer and ${seg.avgFrequency.toFixed(
        1,
      )} orders — the strongest base for personalized cross-selling.`
    case 'potential':
      return `${share}. ${formatNumber(seg.lapsedCount)} of ${formatNumber(
        seg.count,
      )} have not purchased in 180+ days, so a meaningful share of historical value is at risk.`
    case 'emerging':
      return `${share}. Average order value of ${formatCurrency(seg.aov)} vs ${formatCurrency(
        kpis.aov,
      )} overall; the open question is whether they return for a second order.`
    default:
      return `${share}. Average recency of ${Math.round(seg.avgRecency)} days and ${seg.avgFrequency.toFixed(
        1,
      )} orders per customer — individual personalization is unlikely to be cost-efficient here.`
  }
}
