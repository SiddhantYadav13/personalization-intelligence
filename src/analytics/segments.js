// Transparent, rule-based segmentation on RFM scores.
// Rules are evaluated top to bottom; the first match wins.

export const SEGMENTS = [
  {
    id: 'loyalists',
    name: 'High-Value Loyalists',
    short: 'Loyalists',
    color: '#2a78d6',
    rule: 'R ≥ 3, F ≥ 4 and M ≥ 4',
    test: (c) => c.R >= 3 && c.F >= 4 && c.M >= 4,
    profile: 'High spend, frequent orders, purchased recently.',
    action: 'Personalized recommendations & cross-sell',
    intervention: 'Personalized recommendations, cross-category bundles and loyalty-oriented offers based on purchase history.',
    objective: 'Deepen relationships and grow share of wallet.',
  },
  {
    id: 'potential',
    name: 'High-Potential Customers',
    short: 'High-Potential',
    color: '#eb6834',
    rule: 'F ≥ 3 and M ≥ 3 (not a Loyalist)',
    test: (c) => c.F >= 3 && c.M >= 3,
    profile: 'Meaningful value, but engagement is weaker or less recent than Loyalists.',
    action: 'Personalized re-engagement',
    intervention: 'Targeted re-engagement journeys using past category preferences, with retention offers for lapsing customers.',
    objective: 'Retain value at risk and move customers toward loyalty.',
  },
  {
    id: 'emerging',
    name: 'New / Emerging Customers',
    short: 'New / Emerging',
    color: '#1baf7a',
    rule: 'R ≥ 4 (bought in last 90 days) and F ≤ 2',
    test: (c) => c.R >= 4 && c.F <= 2,
    profile: 'Recent first purchases, low order history.',
    action: 'Second-purchase & onboarding',
    intervention: 'Automated, low-cost second-purchase campaigns, complementary product recommendations and onboarding journeys.',
    objective: 'Convert first-time buyers into repeat customers.',
  },
  {
    id: 'low',
    name: 'Low-Engagement Customers',
    short: 'Low-Engagement',
    color: '#c3c1bb',
    rule: 'All remaining customers',
    test: () => true,
    profile: 'Low spend, few orders, mostly older purchases.',
    action: 'Low-cost general campaigns',
    intervention: 'Lower-cost, broad campaigns (seasonal emails, general promotions) rather than individual personalization.',
    objective: 'Maintain reach efficiently without over-investing.',
  },
]

export const SEGMENT_BY_ID = Object.fromEntries(SEGMENTS.map((s) => [s.id, s]))

export function segmentCustomers(customers) {
  return customers.map((c) => ({ ...c, segment: SEGMENTS.find((s) => s.test(c)).id }))
}
