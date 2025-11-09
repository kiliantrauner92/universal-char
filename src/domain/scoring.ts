import { RunMetrics, ScoreResult, StoreItem } from './types'

export type ScoringConfig = {
  basePerChar: number
  wrongPenalty: number
  timeScale: number
}

export const defaultScoring = {
  basePerChar: 1,
  wrongPenalty: 0.5,
  timeScale: 0.25,
} satisfies ScoringConfig

export function targetTimeSecFor(length: number) {
  return length / 4 // ≈ 240 cpm baseline
}

export function computeScore(
  length: number,
  metrics: RunMetrics,
  items: StoreItem[],
  cfg: ScoringConfig = defaultScoring
): ScoreResult {
  const baseGain = cfg.basePerChar * metrics.correct

  // Penalty possibly reduced by items
  const wrongPenaltyPctReduc = items
    .filter(i => i.owned && i.effect.type === 'wrong_penalty_pct' && i.effect.value)
    .reduce((acc, i) => acc + (i.effect.value ?? 0), 0)
  const effectivePenalty = Math.max(0, cfg.wrongPenalty * (1 - wrongPenaltyPctReduc))
  const penalty = effectivePenalty * metrics.wrong

  // Time bonus possibly boosted by items; ALARM texts can get extra boost via caller multiplying metrics.wpm indirectly
  const timeTarget = targetTimeSecFor(length)
  const elapsedSec = Math.max(1, metrics.elapsedMs / 1000)
  const baseTimeBonus = cfg.timeScale * (timeTarget / elapsedSec) * metrics.correct
  const timeBonusPct = items
    .filter(i => i.owned && i.effect.type === 'time_bonus_pct' && i.effect.value)
    .reduce((acc, i) => acc + (i.effect.value ?? 0), 0)
  const timeBonus = baseTimeBonus * (1 + timeBonusPct)

  // Char multiplier
  const charsPct = items
    .filter(i => i.owned && i.effect.type === 'chars_pct' && i.effect.value)
    .reduce((acc, i) => acc + (i.effect.value ?? 0), 0)

  const raw = (baseGain - penalty) * (1 + charsPct) + timeBonus
  const charsAwarded = Math.max(0, Math.floor(raw))

  return {
    charsAwarded,
    breakdown: {
      baseGain,
      penalty,
      timeBonus: Math.floor(timeBonus),
      bonusPct: charsPct,
    },
  }
}
