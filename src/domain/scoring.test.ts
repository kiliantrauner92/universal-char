import { computeScore, defaultScoring } from './scoring'
import type { RunMetrics, StoreItem } from './types'

const noItems: StoreItem[] = []

function m(partial: Partial<RunMetrics>): RunMetrics {
  const now = Date.now()
  return {
    startedAt: now - 1000,
    endedAt: now,
    elapsedMs: 1000,
    correct: 0,
    wrong: 0,
    accuracy: 1,
    wpm: 0,
    alarm: false,
    ...partial,
  }
}

test('base score increases with correct chars and decreases with wrong', () => {
  const length = 100
  const metrics = m({ correct: 80, wrong: 10, elapsedMs: 60_000 })
  const res = computeScore(length, metrics, noItems, defaultScoring)
  expect(res.charsAwarded).toBeGreaterThan(0)
  expect(res.breakdown.baseGain).toBe(80)
  expect(res.breakdown.penalty).toBe(5)
})

test('time bonus rewards faster typing', () => {
  const length = 100
  const fast = m({ correct: 80, wrong: 0, elapsedMs: 10_000 })
  const slow = m({ correct: 80, wrong: 0, elapsedMs: 120_000 })
  const a = computeScore(length, fast, noItems)
  const b = computeScore(length, slow, noItems)
  expect(a.charsAwarded).toBeGreaterThan(b.charsAwarded)
})

 test('item bonuses apply multipliers', () => {
  const length = 100
  const metrics = m({ correct: 80, wrong: 0, elapsedMs: 30_000 })
  const items: StoreItem[] = [
    { id: 'kb', name: 'KB', desc: '', cost: {}, effect: { type: 'chars_pct', value: 0.1 }, owned: true },
    { id: 'coach', name: 'Coach', desc: '', cost: {}, effect: { type: 'time_bonus_pct', value: 0.2 }, owned: true },
  ]
  const base = computeScore(length, metrics, noItems).charsAwarded
  const withItems = computeScore(length, metrics, items).charsAwarded
  expect(withItems).toBeGreaterThan(base)
})
