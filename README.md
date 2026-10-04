# Personalization Intelligence

**From Customer Behavior to Personalization Strategy** — a customer-analytics decision-support tool that identifies where a D2C / e-commerce company should prioritize personalization to create the greatest customer and business value.

## Business Problem

Personalization is often treated as something to roll out to every customer equally. But personalization has real costs (content, tooling, data, campaign effort), and customers differ widely in value and engagement.

The core question this project answers:

> **Where should a company prioritize personalization to create the greatest customer and business value?**

The app helps a business manager or strategy analyst quickly see how valuable the customer base is, which customers are engaged or showing potential, where to prioritize personalization, what to do for each segment, and why.

## Motivation

This project builds on earlier academic research on **AI Hyper-Personalisation and Consumer Trust**, which examined the consumer-side question: *how do privacy concerns and personalization affect consumer trust and acceptance?*

This project explores the complementary business-side question: *even if personalization can create value, should a company personalize every customer equally?*

## Data

**[UCI Online Retail II](https://archive.ics.uci.edu/dataset/502/online+retail+ii)** — real transactions of an anonymised UK-based online gift-ware retailer (many customers are wholesalers), 1 Dec 2009 – 9 Dec 2011, values in GBP.
Citation: Chen, D. (2019). *Online Retail II* [Dataset]. UCI Machine Learning Repository. https://doi.org/10.24432/C5CG6D — licensed CC BY 4.0.

`scripts/prepare-online-retail.py` turns the raw workbook into the file the app reads, with an auditable cleaning trail (also written to `src/data/dataset-meta.json`):

| Step | Line items |
|---|---:|
| Raw line items (both yearly sheets) | 1,067,371 |
| Remove invoices duplicated across the two sheets | 1,044,848 |
| Remove lines without a Customer ID | 809,561 |
| Remove cancellation lines | 791,115 |
| Remove purchases reversed by a matching cancellation | 784,685 |
| Remove non-positive quantity or price | 784,616 |
| Remove non-product codes (postage, fees, adjustments, vouchers) | **781,932** |

The cleaned line items are aggregated to **36,324 orders** from **5,839 customers** (one row per invoice: date, customer, categories, units, revenue).

Two things the source does not contain, handled transparently:
- **Product categories** — derived from item descriptions with ordered keyword rules into 9 categories (e.g. Kitchen & Dining, Home Décor & Lighting, Seasonal & Party). Unmatched items fall into *Other Gifts* (≈11% of revenue).
- **Discounts** — none in the source, so revenue = quantity × unit price.

## Approach

```
Customer transaction data
  → RFM analysis
  → Customer segmentation
  → Personalization Opportunity scoring
  → Business recommendations
```

1. **Customer metrics** — for each customer: Recency (days since last order), Frequency (distinct orders), Monetary (net revenue), Average Order Value, tenure and category diversity.
2. **RFM scores (1–5)** — Recency and Frequency use fixed, explainable bands (e.g. R = 5 for ≤ 30 days; F = 5 for 8+ orders); Monetary uses quintiles of customer spend.
3. **Rule-based segments** (applied in order, first match wins):
   | Segment | Rule |
   |---|---|
   | High-Value Loyalists | R ≥ 3, F ≥ 4, M ≥ 4 |
   | High-Potential Customers | F ≥ 3, M ≥ 3 (not a Loyalist) |
   | New / Emerging Customers | R ≥ 4 and F ≤ 2 |
   | Low-Engagement Customers | everyone else |
4. **Personalization Opportunity Score (0–100)** — `40% Customer Value + 30% Engagement + 30% Growth Potential`
   - *Customer Value*: percentile rank of total spend
   - *Engagement*: 50% recency (linear decay to 0 at 365 days) + 50% frequency (capped at the 95th percentile)
   - *Growth Potential*: 60% AOV percentile + 40% cross-sell headroom (categories not yet bought), halved for customers with no purchase in 12 months
5. **Opportunity matrix** — customers and segments plotted on Opportunity (x) vs Customer Value (y), split at 50 into **Prioritize / Maintain / Test / Deprioritize**.

All metrics, insights and recommendations shown in the app are calculated from the dataset at load time — nothing is hard-coded.

## Application

| Page | What it answers |
|---|---|
| **Overview** | Headline KPIs, dynamically generated executive insights, Customer Value vs Engagement scatter |
| **Customer Segments** | Segment cards, segment filter and detail panel, distribution and revenue charts, value vs recency/frequency |
| **Personalization Opportunities** | Opportunity matrix, segment drill-down (value, engagement, score, rationale, intervention, objective), ranked opportunity table |
| **Strategy** | Four recommended strategies backed by segment data, and a measurement framework of KPIs to track |

## Tech Stack

- React (Vite)
- JavaScript
- Tailwind CSS
- Recharts
- Lucide React
- React Router

No backend, database or ML — analytics are deterministic JavaScript functions in `src/analytics/`.

```
src/
  analytics/    parseTransactions, calculateRFM, segmentCustomers,
                calculateOpportunityScore, calculateKPIs, generateInsights
  components/   layout, shared UI, chart components
  pages/        Overview, Segments, Opportunities, Strategy
  data/         transactions.csv (cleaned orders), dataset-meta.json (provenance + cleaning audit)
  utils/        formatting helpers, stratified sampling for scatter plots
scripts/
  prepare-online-retail.py  raw UCI workbook -> cleaned order-level CSV (pandas + openpyxl)
  verify-analytics.mjs      prints KPIs, segment table and insights for checking
```

## Running locally

```bash
npm install
npm run dev
```

```bash
npm run build              # production build
npm run verify:analytics   # print computed metrics in the terminal
```

To rebuild the dataset from source, download `online_retail_II.xlsx` from the UCI page above, then (with `pandas` and `openpyxl` installed):

```bash
npm run prepare:data -- path/to/online_retail_II.xlsx
```

Scatter plots draw a deterministic, segment-stratified sample of 1,500 customers to keep the charts responsive; every KPI, segment and score uses all 5,839 customers.

## Key Insights

From the cleaned Online Retail II data (5,839 customers · 36,324 orders · £16.5m revenue · AOV £455 · 72% repeat purchase rate). Reproduce with `npm run verify:analytics`.

- **Value is highly concentrated.** High-Value Loyalists are **28%** of customers but generate **78%** of revenue, averaging 15.4 orders each.
- **A long, low-value tail.** Low-Engagement customers are **37%** of customers but only **6%** of revenue — individual personalization is hard to justify here.
- **Value at risk.** **598** High-Potential customers have not purchased in 180+ days despite meaningful historical value. As a segment they land in the *Maintain* quadrant: valuable, but with lower opportunity than Loyalists.
- **Loyalists spend more per order.** Their average order value is **£512** vs **£455** overall (+13%).
- **New customers are an early-stage bet.** New / Emerging customers are **12%** of customers and **2%** of revenue, and their segment average sits in *Deprioritize* — yet 106 of them already score in *Prioritize*, which argues for low-cost, automated second-purchase journeys rather than heavy investment.
- **2,188 customers (37%)** individually fall in the *Prioritize* quadrant.

## Business Recommendations

Each segment's recommended personalization investment is derived from its quadrant in the opportunity matrix (Prioritize → High, Maintain → Medium, Test → Low / test & learn, Deprioritize → Low), so the strategy always follows the analysis.

1. **Prioritize high-value customers** *(High)* — personalized recommendations, cross-category bundles and loyalty-oriented offers for Loyalists.
2. **Re-engage high-potential customers** *(Medium)* — targeted win-back journeys based on past category preferences for valuable customers whose engagement is weakening.
3. **Accelerate second purchases** *(Low)* — automated, low-cost onboarding and complementary product recommendations for New / Emerging customers while their value is unproven.
4. **Avoid over-personalization** *(Low)* — use lower-cost, general campaigns for Low-Engagement customers.

**Recommended KPIs to monitor:** repeat purchase rate, average order value, customer retention, conversion rate and customer lifetime value — ideally measured per segment against a holdout group.

## Disclaimer

This project uses a public dataset (UCI Online Retail II, CC BY 4.0) of an anonymised retailer and is intended as a portfolio demonstration. The Personalization Opportunity Score is a prioritization framework, not a causal or predictive measure of personalization ROI.

Product categories are derived heuristically from item descriptions, and no personalization intervention has been run — recommended KPIs are framed as things to measure, not results achieved.

## Future Improvements

- A/B testing of personalization interventions by segment
- The retailer's own product taxonomy instead of keyword-derived categories
- Causal uplift modeling to estimate incremental impact
- Customer lifetime value (CLV) modeling
- Production database
- Backend API
