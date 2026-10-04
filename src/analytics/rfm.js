// Customer-level behavioural metrics and RFM scoring (1–5).

const DAY_MS = 86400000
const toTime = (iso) => new Date(`${iso}T00:00:00Z`).getTime()

// Recency bands (days since last purchase) -> score
export const RECENCY_BANDS = [
  { max: 30, score: 5, label: '≤ 30 days' },
  { max: 90, score: 4, label: '31–90 days' },
  { max: 180, score: 3, label: '91–180 days' },
  { max: 365, score: 2, label: '181–365 days' },
  { max: Infinity, score: 1, label: '> 365 days' },
]

// Frequency bands (distinct orders) -> score
export const FREQUENCY_BANDS = [
  { min: 8, score: 5, label: '8+ orders' },
  { min: 5, score: 4, label: '5–7 orders' },
  { min: 3, score: 3, label: '3–4 orders' },
  { min: 2, score: 2, label: '2 orders' },
  { min: 1, score: 1, label: '1 order' },
]

export const recencyScore = (days) => RECENCY_BANDS.find((b) => days <= b.max).score
export const frequencyScore = (orders) => FREQUENCY_BANDS.find((b) => orders >= b.min).score

// Share of values strictly below each value (ties share the same rank).
export function percentileBelow(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const firstIndex = new Map()
  sorted.forEach((v, i) => {
    if (!firstIndex.has(v)) firstIndex.set(v, i)
  })
  return (v) => firstIndex.get(v) / sorted.length
}

// Mid-rank percentile (0–100) — used for continuous 0–100 normalisation.
export function percentileRank(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  const ranks = new Map()
  let i = 0
  while (i < n) {
    let j = i
    while (j + 1 < n && sorted[j + 1] === sorted[i]) j++
    ranks.set(sorted[i], (((i + j) / 2) / Math.max(1, n - 1)) * 100)
    i = j + 1
  }
  return (v) => ranks.get(v)
}

export function calculateRFM(transactions) {
  // Reduce rather than spread: tens of thousands of arguments can overflow the browser call stack.
  const analysisTime = transactions.reduce((max, t) => Math.max(max, toTime(t.orderDate)), -Infinity) + DAY_MS
  const byCustomer = new Map()

  for (const t of transactions) {
    let c = byCustomer.get(t.customerId)
    if (!c) {
      c = { customerId: t.customerId, region: t.region, orders: new Set(), categories: new Set(), monetary: 0, first: Infinity, last: -Infinity }
      byCustomer.set(t.customerId, c)
    }
    const time = toTime(t.orderDate)
    c.orders.add(t.orderId)
    t.categories.forEach((cat) => c.categories.add(cat))
    c.monetary += t.revenue
    c.first = Math.min(c.first, time)
    c.last = Math.max(c.last, time)
  }

  const customers = [...byCustomer.values()].map((c) => {
    const frequency = c.orders.size
    const recency = Math.round((analysisTime - c.last) / DAY_MS)
    return {
      customerId: c.customerId,
      region: c.region,
      recency,
      frequency,
      monetary: c.monetary,
      aov: c.monetary / frequency,
      tenure: Math.round((analysisTime - c.first) / DAY_MS),
      categoryCount: c.categories.size,
      R: recencyScore(recency),
      F: frequencyScore(frequency),
    }
  })

  // Monetary is scored in quintiles of the customer base.
  const below = percentileBelow(customers.map((c) => c.monetary))
  for (const c of customers) {
    c.M = Math.min(5, Math.floor(below(c.monetary) * 5) + 1)
    c.rfmScore = c.R + c.F + c.M
  }

  return { customers, analysisDate: new Date(analysisTime).toISOString().slice(0, 10) }
}
