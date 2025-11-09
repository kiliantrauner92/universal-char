export function craftArticleCost(base: number, items: { effect: { type: string; value?: number }[] }) {
  const costReduc = items.effect
    .filter(e => e.type === 'article_cost_pct' && e.value)
    .reduce((a, e) => a + (e.value ?? 0), 0)
  return Math.max(1, Math.floor(base * (1 - costReduc)))
}

export function clampPrice(base: number, price: number) {
  const min = Math.floor(base * 0.5)
  const max = Math.ceil(base * 2.0)
  return Math.min(max, Math.max(min, Math.round(price)))
}
