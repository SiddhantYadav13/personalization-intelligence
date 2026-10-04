import csvUrl from '../data/transactions.csv?url'
import meta from '../data/dataset-meta.json'
import { buildAnalytics } from './pipeline.js'

// The dataset ships as a separate, cacheable asset and is analysed once at load.
const csv = await fetch(csvUrl).then((res) => res.text())
export const analytics = buildAnalytics(csv, meta)
