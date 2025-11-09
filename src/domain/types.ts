export type Text = {
  id: string
  title: string
  genre: string
  body: string
  difficulty?: number
}

export type RunMetrics = {
  startedAt: number
  endedAt: number
  elapsedMs: number
  correct: number
  wrong: number
  accuracy: number
  wpm: number
  alarm?: boolean
}

export type ScoreBreakdown = {
  baseGain: number
  penalty: number
  timeBonus: number
  bonusPct: number
}

export type ScoreResult = {
  charsAwarded: number
  breakdown: ScoreBreakdown
}

export type StoreItemEffectType =
  | 'chars_pct'
  | 'wrong_penalty_pct'
  | 'time_bonus_pct'
  | 'article_cost_pct'
  | 'price_pct'
  | 'skip_unlimited'

export type StoreItem = {
  id: string
  name: string
  desc: string
  cost: { chars?: number; money?: number }
  requires?: string[]
  effect: { type: StoreItemEffectType; value?: number }
  owned?: boolean
  visible?: boolean
}

export type Achievement = {
  id: string
  name: string
  desc?: string
  unlockedAt?: number
}

export type Prices = {
  articleBase: number
  bookBase: number
  article: number
  book: number
}

export type Inventory = {
  articles: number
  books: number
}

export type Player = {
  chars: number
  lifetimeChars: number
  money: number
  inventory: Inventory
  prices: Prices
  skips: number
  welcomeComplete: boolean
}

export type GameEvent = {
  id: string
  ts: number
  message: string
}

export type SaveGame = {
  version: 1
  player: Player
  items: StoreItem[]
  achievements: Achievement[]
  logs: GameEvent[]
}
