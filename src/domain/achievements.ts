import { Achievement, GameEvent, Player, StoreItem } from './types'

export type AchievementCheckInput = {
  player: Player
  lastRun?: { correct: number; wrong: number; elapsedMs: number }
  lifetimeRuns: number
}

export function evaluateAchievements(
  input: AchievementCheckInput,
  achievements: Achievement[],
  items: StoreItem[]
): { unlocked: Achievement[]; itemsUpdated: StoreItem[]; events: GameEvent[] } {
  const now = Date.now()
  const aMap = new Map(achievements.map(a => [a.id, a]))
  const newly: Achievement[] = []
  const events: GameEvent[] = []

  const ensure = (id: string, name: string, cond: boolean) => {
    const a = aMap.get(id)
    if (cond && !a?.unlockedAt) {
      const newA: Achievement = { id, name, unlockedAt: now }
      newly.push(newA)
      events.push({ id: `a:${id}:${now}`, ts: now, message: `Achievement unlocked: ${name}` })
    }
  }

  // Examples based on plan
  ensure('100in60', 'Type 100 in 60s', (input.lastRun?.correct ?? 0) >= 100 && (input.lastRun?.elapsedMs ?? 0) <= 60_000)
  ensure('flawless10', 'Flawless x10', input.lifetimeRuns >= 10 && (input.lastRun?.wrong ?? 1) === 0)
  ensure('3kLifetime', '3,000 Lifetime Chars', input.player.lifetimeChars >= 3000)
  ensure('firstChapter', 'First Chapter (5 texts)', input.lifetimeRuns >= 5)

  // Apply visibility from achievements to items
  const itemsUpdated = items.map(it => {
    if (it.visible) return it
    const reqs = it.requires ?? []
    const ok = reqs.every(rid => (aMap.get(rid)?.unlockedAt || newly.find(a => a.id === rid)))
    return ok ? { ...it, visible: true } : it
  })

  return { unlocked: newly, itemsUpdated, events }
}
