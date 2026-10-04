// Deterministic stratified sample for scatter plots.
// Thousands of SVG points make charts sluggish, so plots show a sample that keeps each
// segment's share of customers; all metrics and scores still use every customer.

export const PLOT_SAMPLE_SIZE = 1500

export function stratifiedSample(customers, size = PLOT_SAMPLE_SIZE, key = 'segment') {
  if (customers.length <= size) return customers
  const groups = new Map()
  for (const c of customers) {
    if (!groups.has(c[key])) groups.set(c[key], [])
    groups.get(c[key]).push(c)
  }
  const ratio = size / customers.length
  const sample = []
  for (const members of groups.values()) {
    const sorted = [...members].sort((a, b) => a.customerId.localeCompare(b.customerId))
    const take = Math.max(1, Math.round(sorted.length * ratio))
    const step = sorted.length / take
    for (let i = 0; i < take; i++) sample.push(sorted[Math.floor(i * step)])
  }
  return sample
}
