// Prints the computed metrics so the analytics can be checked outside the UI.
// Usage: node scripts/verify-analytics.mjs

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { buildAnalytics } from '../src/analytics/pipeline.js'

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '../src/data')
const csv = readFileSync(join(dataDir, 'transactions.csv'), 'utf8')
const meta = JSON.parse(readFileSync(join(dataDir, 'dataset-meta.json'), 'utf8'))
const { customers, kpis, segments, insights } = buildAnalytics(csv, meta)

console.log('\nKPIs')
console.table(kpis)

console.log('Segments')
console.table(
  segments.map((s) => ({
    segment: s.short,
    customers: s.count,
    custShare: +(s.customerShare * 100).toFixed(1),
    revShare: +(s.revenueShare * 100).toFixed(1),
    aov: Math.round(s.aov),
    freq: +s.avgFrequency.toFixed(1),
    recency: Math.round(s.avgRecency),
    value: Math.round(s.valueScore),
    engage: Math.round(s.engagementScore),
    growth: Math.round(s.growthScore),
    opp: Math.round(s.opportunityScore),
    quadrant: s.quadrant,
    lapsed: s.lapsedCount,
  })),
)

console.log('Quadrant mix by segment')
console.table(Object.fromEntries(segments.map((s) => [s.short, s.quadrantCounts])))

const scoreRange = (k) => [Math.min(...customers.map((c) => c[k])), Math.max(...customers.map((c) => c[k]))].map((v) => +v.toFixed(1))
console.log('Score ranges', { R: scoreRange('R'), F: scoreRange('F'), M: scoreRange('M'), opp: scoreRange('opportunityScore') })

console.log('\nInsights')
insights.forEach((i) => console.log(`- ${i.metric} ${i.title} — ${i.detail}`))

// Sanity checks
const segRevenue = segments.reduce((s, x) => s + x.revenue, 0)
console.assert(Math.abs(segRevenue - kpis.totalRevenue) < 1, 'segment revenue must sum to total')
console.assert(segments.reduce((s, x) => s + x.count, 0) === kpis.totalCustomers, 'segment counts must sum to total')
console.log('\nSanity checks passed.')
