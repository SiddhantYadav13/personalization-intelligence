// Personalization Opportunity Score — a transparent prioritization framework,
// not a predictive or causal measure.
//
//   Opportunity = 40% Customer Value + 30% Engagement + 30% Growth Potential
//
// Every component is normalised to 0–100.

import { percentileRank } from './rfm.js'

export const WEIGHTS = { value: 0.4, engagement: 0.3, growth: 0.3 }
export const RECENCY_HORIZON_DAYS = 365
export const QUADRANT_THRESHOLD = 50

export const QUADRANTS = {
  prioritize: { id: 'prioritize', label: 'Prioritize', hint: 'High value · high opportunity' },
  maintain: { id: 'maintain', label: 'Maintain', hint: 'High value · lower opportunity' },
  test: { id: 'test', label: 'Test', hint: 'Lower value · high opportunity' },
  deprioritize: { id: 'deprioritize', label: 'Deprioritize', hint: 'Lower value · lower opportunity' },
}

// Recommended personalization investment follows the matrix quadrant, so the
// strategy can never contradict the analysis.
export const INVESTMENT_BY_QUADRANT = {
  prioritize: 'High',
  maintain: 'Medium',
  test: 'Low (test & learn)',
  deprioritize: 'Low',
}

export function quadrantFor(value, opportunity) {
  const highValue = value >= QUADRANT_THRESHOLD
  const highOpp = opportunity >= QUADRANT_THRESHOLD
  if (highValue && highOpp) return 'prioritize'
  if (highValue) return 'maintain'
  if (highOpp) return 'test'
  return 'deprioritize'
}

const percentile = (values, p) => {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
}

export function calculateOpportunityScore(customers, totalCategories) {
  const valueRank = percentileRank(customers.map((c) => c.monetary))
  const aovRank = percentileRank(customers.map((c) => c.aov))
  const frequencyCap = Math.max(2, percentile(customers.map((c) => c.frequency), 0.95))

  return customers.map((c) => {
    // Customer Value: percentile rank of total revenue.
    const valueScore = valueRank(c.monetary)

    // Engagement: half recency (linear decay over 12 months), half frequency (capped at the 95th percentile).
    const recencyPart = 100 * Math.max(0, 1 - c.recency / RECENCY_HORIZON_DAYS)
    const frequencyPart = 100 * Math.min(1, c.frequency / frequencyCap)
    const engagementScore = 0.5 * recencyPart + 0.5 * frequencyPart

    // Growth Potential: spend per order (AOV percentile) and cross-sell headroom
    // (categories not yet purchased), discounted for customers outside the 12-month reach window.
    const headroom = 100 * (1 - (c.categoryCount - 1) / Math.max(1, totalCategories - 1))
    const reach = c.recency <= RECENCY_HORIZON_DAYS ? 1 : 0.5
    const growthScore = (0.6 * aovRank(c.aov) + 0.4 * headroom) * reach

    const opportunityScore =
      WEIGHTS.value * valueScore + WEIGHTS.engagement * engagementScore + WEIGHTS.growth * growthScore

    return {
      ...c,
      valueScore,
      engagementScore,
      growthScore,
      opportunityScore,
      quadrant: quadrantFor(valueScore, opportunityScore),
    }
  })
}
