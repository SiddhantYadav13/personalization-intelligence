// Display formatting. The dataset is in GBP (UCI Online Retail II, UK retailer).
const gbpCompact = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 })
const num = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 })

export const formatCurrency = (v) => gbp.format(v)
export const formatCurrencyCompact = (v) => gbpCompact.format(v)
export const formatNumber = (v) => num.format(v)
export const formatPercent = (v, digits = 0) => `${(v * 100).toFixed(digits)}%`
export const formatScore = (v) => v.toFixed(0)
export const formatDecimal = (v, digits = 1) => v.toFixed(digits)
export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
