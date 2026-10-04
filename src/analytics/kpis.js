// Business-level KPIs and per-segment summaries.

import { SEGMENTS } from './segments.js'
import { INVESTMENT_BY_QUADRANT, quadrantFor } from './opportunity.js'

const mean = (arr, key) => (arr.length ? arr.reduce((s, x) => s + x[key], 0) / arr.length : 0)

export function calculateKPIs(transactions, customers) {
  const totalRevenue = transactions.reduce((s, t) => s + t.revenue, 0)
  const totalOrders = new Set(transactions.map((t) => t.orderId)).size
  const dates = transactions.map((t) => t.orderDate).sort()
  const highOpportunity = customers.filter((c) => c.quadrant === 'prioritize')

  return {
    totalCustomers: customers.length,
    totalRevenue,
    totalOrders,
    transactionRows: transactions.length,
    aov: totalRevenue / totalOrders,
    repeatRate: customers.filter((c) => c.frequency >= 2).length / customers.length,
    activeRate: customers.filter((c) => c.recency <= 365).length / customers.length,
    revenuePerCustomer: totalRevenue / customers.length,
    highOpportunityCount: highOpportunity.length,
    highOpportunityShare: highOpportunity.length / customers.length,
    startDate: dates[0],
    endDate: dates[dates.length - 1],
  }
}

export function summarizeSegments(customers, kpis) {
  return SEGMENTS.map((seg) => {
    const members = customers.filter((c) => c.segment === seg.id)
    const revenue = members.reduce((s, c) => s + c.monetary, 0)
    const orders = members.reduce((s, c) => s + c.frequency, 0)
    const valueScore = mean(members, 'valueScore')
    const opportunityScore = mean(members, 'opportunityScore')
    const quadrant = quadrantFor(valueScore, opportunityScore)
    const quadrantCounts = { prioritize: 0, maintain: 0, test: 0, deprioritize: 0 }
    members.forEach((c) => quadrantCounts[c.quadrant]++)

    return {
      ...seg,
      count: members.length,
      customerShare: members.length / kpis.totalCustomers,
      revenue,
      revenueShare: revenue / kpis.totalRevenue,
      aov: orders ? revenue / orders : 0,
      avgFrequency: mean(members, 'frequency'),
      avgRecency: mean(members, 'recency'),
      avgMonetary: mean(members, 'monetary'),
      avgCategories: mean(members, 'categoryCount'),
      valueScore,
      engagementScore: mean(members, 'engagementScore'),
      growthScore: mean(members, 'growthScore'),
      opportunityScore,
      lapsedCount: members.filter((c) => c.R <= 2).length,
      quadrant,
      quadrantCounts,
      investment: INVESTMENT_BY_QUADRANT[quadrant],
    }
  })
}
