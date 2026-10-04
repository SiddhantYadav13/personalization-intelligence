// Parses the order-level transaction CSV (see scripts/prepare-online-retail.py) into typed records.

function splitCsvLine(line) {
  const out = []
  let cur = ''
  let quoted = false
  for (const ch of line) {
    if (ch === '"') quoted = !quoted
    else if (ch === ',' && !quoted) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  out.push(cur)
  return out
}

export function parseTransactions(csvText) {
  const [header, ...lines] = csvText.trim().split(/\r?\n/)
  const keys = splitCsvLine(header)
  return lines.map((line) => {
    const row = Object.fromEntries(splitCsvLine(line).map((v, i) => [keys[i], v]))
    return {
      orderId: row.order_id,
      customerId: row.customer_id,
      orderDate: row.order_date,
      categories: row.categories.split('|'),
      items: Number(row.items),
      revenue: Number(row.revenue),
      region: row.region,
    }
  })
}
