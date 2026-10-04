// Full analytics pipeline: raw CSV -> customers -> segments -> scores -> KPIs -> insights.

import { parseTransactions } from './parseTransactions.js'
import { calculateRFM } from './rfm.js'
import { segmentCustomers } from './segments.js'
import { calculateOpportunityScore } from './opportunity.js'
import { calculateKPIs, summarizeSegments } from './kpis.js'
import { generateInsights } from './insights.js'

// `meta` (optional) is the provenance file written by the data-prep script.
export function buildAnalytics(csvText, meta = null) {
  const transactions = parseTransactions(csvText)
  const totalCategories = new Set(transactions.flatMap((t) => t.categories)).size
  const { customers: rfm, analysisDate } = calculateRFM(transactions)
  const customers = calculateOpportunityScore(segmentCustomers(rfm), totalCategories)
  const kpis = { ...calculateKPIs(transactions, customers), analysisDate, totalCategories }
  // Rows in the shipped file are orders; report the cleaned line-item count from the source.
  if (meta?.cleanLineItems) kpis.transactionRows = meta.cleanLineItems
  const segments = summarizeSegments(customers, kpis)
  const insights = generateInsights(kpis, segments)
  return { transactions, customers, kpis, segments, insights, meta }
}
