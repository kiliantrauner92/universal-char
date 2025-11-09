import { create } from 'zustand'
import { persist as zPersist, createJSONStorage } from 'zustand/middleware'
import { Achievement, GameEvent, Player, Prices, StoreItem, Text } from '../domain/types'
import { loadTexts } from '../domain/texts.service'
import { computeScore } from '../domain/scoring'
import { evaluateAchievements } from '../domain/achievements'

export type RunState = {
  text?: Text
  typed: string
  status: 'idle' | 'active' | 'finished'
  startedAt?: number
  endedAt?: number
  correct: number
  wrong: number
  alarm?: boolean
  timeLimitSec?: number
}

type PerfComment = { id: string; text: string; tone: 'negative' | 'positive' | 'info' }

type GameState = {
  texts: Text[]
  run: RunState
  player: Player
  items: StoreItem[]
  achievements: Achievement[]
  logs: GameEvent[]
  lifetimeRuns: number
  gameStartAt: number
  lastAward?: { amount: number; ts: number }
  alarm: { pending: boolean; countdown: number; triggeredFirst: boolean; triggeredSecond: boolean }
  comments: { queue: PerfComment[] }

  // selectors
  visibleItems: () => StoreItem[]

  // actions
  init: () => void
  loadSeedTexts: () => Promise<void>
  startRun: (opts?: { alarm?: boolean; timeLimitSec?: number }) => void
  typeChar: (ch: string) => void
  skipText: () => void
  completeRun: () => void
  maybeTriggerAlarms: () => void
  tickAlarm: () => void
  pushComments: (msgs: PerfComment[]) => void
  popComment: () => void
  buyItem: (id: string) => void
  craftArticle: (count?: number) => void
  craftBook: (count?: number) => void
  sellArticle: (count?: number) => void
  sellBook: (count?: number) => void
  buyPaper: () => void
  adjustPrice: (kind: 'article' | 'book', dir: 'up' | 'down') => void
}

function defaultItems(): StoreItem[] {
  return [
    { id: 'kb', name: 'Better Keyboard', desc: '+10% chars', cost: { chars: 800 }, effect: { type: 'chars_pct', value: 0.10 }, visible: true },
    { id: 'caps', name: 'Precision Caps', desc: '-20% wrong penalty', cost: { chars: 400, money: 10 }, effect: { type: 'wrong_penalty_pct', value: 0.20 }, requires: ['flawless10'] },
    { id: 'coach', name: 'Time Coach', desc: '+15% time bonus', cost: { chars: 600 }, effect: { type: 'time_bonus_pct', value: 0.15 }, visible: true },
    { id: 'press', name: 'Article Press', desc: '-15% article cost', cost: { chars: 500, money: 25 }, effect: { type: 'article_cost_pct', value: 0.15 }, requires: ['firstChapter'] },
    { id: 'pricing', name: 'Pricing Advisor', desc: '+10% sell price', cost: { chars: 300, money: 40 }, effect: { type: 'price_pct', value: 0.10 } },
    { id: 'skips', name: 'Endless Skips', desc: 'Skips unlimited', cost: { chars: 1200, money: 100 }, effect: { type: 'skip_unlimited' }, requires: ['3kLifetime'] },
  ]
}

function defaultPrices(): Prices {
  return { articleBase: 25, bookBase: 220, article: 25, book: 220 }
}

function defaultPlayer(): Player {
  return {
    chars: 0,
    lifetimeChars: 0,
    money: 0,
    paper: 100,
    inventory: { articles: 0, books: 0 },
    prices: defaultPrices(),
    skips: 5,
    welcomeComplete: false,
  }
}

export const useGame = create<GameState>()(
  zPersist(
    (set, get) => ({
      texts: [],
      run: { status: 'idle', typed: '', correct: 0, wrong: 0 },
      player: defaultPlayer(),
      items: defaultItems(),
      achievements: [],
      logs: [],
      lifetimeRuns: 0,
      gameStartAt: Date.now(),
      alarm: { pending: false, countdown: 0, triggeredFirst: false, triggeredSecond: false },
      comments: { queue: [] },

      visibleItems: () => get().items.filter(i => i.visible && !i.owned).slice(0, 5),

      init: () => {
        // ensure game start timestamp exists
        const s = get()
        if (!s.gameStartAt) set({ gameStartAt: Date.now() })
      },

      loadSeedTexts: async () => {
        if (get().texts.length) return
        try {
          const texts = await loadTexts()
          set({ texts })
        } catch (e) {
          set(state => ({ logs: state.logs.concat({ id: 'err:texts', ts: Date.now(), message: 'Failed to load texts' }) }))
        }
      },

      startRun: (opts) => {
        const { texts, player } = get()
        if (!texts.length) return
        if (!opts?.alarm && player.paper <= 0) return // require paper for normal runs
        const idx = Math.floor(Math.random() * texts.length)
        const text = texts[idx]
        set({
          run: { status: 'active', text, typed: '', correct: 0, wrong: 0, startedAt: undefined, alarm: !!opts?.alarm, timeLimitSec: opts?.timeLimitSec },
        })
      },

      typeChar: (ch: string) => {
        const { run } = get()
        if (run.status !== 'active' || !run.text) return
        const target = run.text.body[run.typed.length]
        if (target === undefined) return
        const correct = ch === target
        set({
          run: {
            ...run,
            startedAt: run.startedAt ?? Date.now(),
            typed: run.typed + ch,
            correct: run.correct + (correct ? 1 : 0),
            wrong: run.wrong + (correct ? 0 : 1),
          },
        })
        if (run.typed.length + 1 >= run.text.body.length) {
          get().completeRun()
        }
      },

      skipText: () => {
        const s = get()
        const unlimited = s.items.some(i => i.owned && i.effect.type === 'skip_unlimited')
        if (!unlimited) {
          if (s.player.skips <= 0) return
          set({ player: { ...s.player, skips: s.player.skips - 1 } })
        }
        // immediately start next text
        get().startRun()
      },

      completeRun: () => {
        const s = get()
        const run = s.run
        if (run.status !== 'active' || !run.text || !run.startedAt) return
        const endedAt = Date.now()
        const elapsedMs = endedAt - run.startedAt
        const accuracy = run.correct + run.wrong > 0 ? run.correct / (run.correct + run.wrong) : 1
        const wpm = (run.correct / 5) / (elapsedMs / 60000)
        const metrics: any = { startedAt: run.startedAt, endedAt, elapsedMs, correct: run.correct, wrong: run.wrong, accuracy, wpm }
        if (typeof run.alarm === 'boolean') metrics.alarm = run.alarm
        const score = computeScore(run.text.body.length, metrics, s.items)

        const msgs: PerfComment[] = []
        // NEGATIVE: all wrong
        const allWrong = run.correct === 0 && run.wrong >= (run.text?.body.length ?? 0)
        if (allWrong) {
          msgs.push({ id: `c:dried:${endedAt}`, text: 'You dried!', tone: 'negative' })
        }
        // POSITIVE: speed + low mistakes
        const cps = run.correct / Math.max(1, elapsedMs / 1000)
        const fastCpsThreshold = 6 // starting point, can tune later
        if (cps >= fastCpsThreshold && run.wrong <= 5) {
          msgs.push({ id: `c:speed:${endedAt}`, text: 'My name is speed!', tone: 'positive' })
        }
        // POSITIVE: flawless
        if (run.wrong === 0) {
          msgs.push({ id: `c:flawless:${endedAt}`, text: 'Living the moment', tone: 'positive' })
        }

        let newPlayer: Player = {
          ...s.player,
          chars: s.player.chars + score.charsAwarded,
          lifetimeChars: s.player.lifetimeChars + score.charsAwarded,
          skips: s.player.skips + 1, // +1 per completed text
          paper: Math.max(0, s.player.paper - 1),
        }

        if (allWrong && !s.player.driedBonusRedeemed) {
          newPlayer = { ...newPlayer, chars: newPlayer.chars * 2, driedBonusRedeemed: true }
        }

        const lifetimeRuns = s.lifetimeRuns + 1
        const ach = evaluateAchievements({ player: newPlayer, lastRun: { correct: run.correct, wrong: run.wrong, elapsedMs }, lifetimeRuns }, s.achievements, s.items)

        const items = s.items
          .map(it => (it.id === it.id ? it : it))
          .map(it => (ach.itemsUpdated.find(u => u.id === it.id) ?? it))

        const logs = s.logs.concat([
          { id: `run:${endedAt}`, ts: endedAt, message: `Completed: +${score.charsAwarded} chars (acc ${(accuracy*100).toFixed(0)}%, wpm ${wpm.toFixed(0)})` },
          ...ach.events,
        ])

        set({
          run: { ...run, status: 'finished', endedAt },
          player: newPlayer,
          achievements: s.achievements.concat(ach.unlocked),
          items,
          logs,
          lifetimeRuns,
          lastAward: { amount: score.charsAwarded, ts: endedAt },
          comments: { queue: s.comments.queue.concat(msgs) },
        })
        // immediately open next text if paper remains (or alarm will handle special runs)
        if (get().player.paper > 0) get().startRun()
        // check alarms after awarding
        get().maybeTriggerAlarms()
      },

      buyItem: (id: string) => {
        const s = get()
        const it = s.items.find(i => i.id === id)
        if (!it || it.owned) return
        const costChars = it.cost.chars ?? 0
        const costMoney = it.cost.money ?? 0
        if (s.player.chars < costChars || s.player.money < costMoney) return
        set({
          player: { ...s.player, chars: s.player.chars - costChars, money: s.player.money - costMoney },
          items: s.items.map(i => (i.id === id ? { ...i, owned: true } : i)),
          logs: s.logs.concat({ id: `buy:${id}:${Date.now()}`, ts: Date.now(), message: `Bought ${it.name}` }),
        })
      },

      craftArticle: (count = 1) => {
        const s = get()
        const baseCost = 400
        const costReduc = s.items.filter(i => i.owned && i.effect.type === 'article_cost_pct' && i.effect.value).reduce((a, i) => a + (i.effect.value ?? 0), 0)
        const costPer = Math.max(1, Math.floor(baseCost * (1 - costReduc)))
        const total = costPer * count
        if (s.player.chars < total) return
        set({
          player: { ...s.player, chars: s.player.chars - total, inventory: { ...s.player.inventory, articles: s.player.inventory.articles + count } },
        })
      },

      craftBook: (count = 1) => {
        const s = get()
        const baseCost = 2500
        const total = baseCost * count
        if (s.player.chars < total) return
        set({
          player: { ...s.player, chars: s.player.chars - total, inventory: { ...s.player.inventory, books: s.player.inventory.books + count } },
        })
      },

      sellArticle: (count = 1) => {
        const s = get()
        if (s.player.inventory.articles < count) return
        const priceBonus = s.items.filter(i => i.owned && i.effect.type === 'price_pct' && i.effect.value).reduce((a, i) => a + (i.effect.value ?? 0), 0)
        const unit = Math.round(s.player.prices.article * (1 + priceBonus))
        const money = unit * count
        set({
          player: {
            ...s.player,
            money: s.player.money + money,
            inventory: { ...s.player.inventory, articles: s.player.inventory.articles - count },
          },
        })
      },

      sellBook: (count = 1) => {
        const s = get()
        if (s.player.inventory.books < count) return
        const priceBonus = s.items.filter(i => i.owned && i.effect.type === 'price_pct' && i.effect.value).reduce((a, i) => a + (i.effect.value ?? 0), 0)
        const unit = Math.round(s.player.prices.book * (1 + priceBonus))
        const money = unit * count
        set({
          player: {
            ...s.player,
            money: s.player.money + money,
            inventory: { ...s.player.inventory, books: s.player.inventory.books - count },
          },
        })
      },

      adjustPrice: (kind, dir) => {
        const s = get()
        const step = dir === 'up' ? 1.05 : 0.95
        const base = kind === 'article' ? s.player.prices.articleBase : s.player.prices.bookBase
        const current = kind === 'article' ? s.player.prices.article : s.player.prices.book
        const next = Math.round(current * step)
        const min = Math.floor(base * 0.5)
        const max = Math.ceil(base * 2.0)
        const clamped = Math.min(max, Math.max(min, next))
        set({
          player: {
            ...s.player,
            prices: {
              ...s.player.prices,
              [kind]: clamped,
            },
          },
        })
      },

      buyPaper: () => {
        const s = get()
        const cost = 10
        if (s.player.money < cost) return
        set({ player: { ...s.player, money: s.player.money - cost, paper: s.player.paper + 100 } })
      },

      maybeTriggerAlarms: () => {
        const s = get()
        if (s.alarm.pending) return
        const now = Date.now()
        if (!s.alarm.triggeredFirst && s.player.lifetimeChars >= 1000) {
          set({ alarm: { ...s.alarm, pending: true, countdown: 5, triggeredFirst: true } , logs: s.logs.concat({ id: `alarm1:${now}`, ts: now, message: 'ALARM incoming: Prepare!' }) })
          return
        }
        if (!s.alarm.triggeredSecond && now - s.gameStartAt >= 10 * 60 * 1000) {
          set({ alarm: { ...s.alarm, pending: true, countdown: 5, triggeredSecond: true } , logs: s.logs.concat({ id: `alarm2:${now}`, ts: now, message: 'ALARM incoming: Prepare!' }) })
          return
        }
      },

      tickAlarm: () => {
        const s = get()
        if (!s.alarm.pending) return
        const next = s.alarm.countdown - 1
        if (next <= 0) {
          set({ alarm: { ...s.alarm, pending: false, countdown: 0 } , logs: s.logs.concat({ id: `alarmStart:${Date.now()}`, ts: Date.now(), message: 'ALARM started!' }) })
          // start special run with time limit and bonus
          get().startRun({ alarm: true, timeLimitSec: 30 })
        } else {
          set({ alarm: { ...s.alarm, countdown: next } })
        }
      },

      pushComments: (msgs) => {
        const s = get()
        if (!msgs.length) return
        set({ comments: { queue: s.comments.queue.concat(msgs) } })
      },

      popComment: () => {
        const s = get()
        if (!s.comments.queue.length) return
        set({ comments: { queue: s.comments.queue.slice(1) } })
      },
    }),
    {
      name: 'universal-char-save-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ player: s.player, items: s.items, achievements: s.achievements, logs: s.logs, gameStartAt: s.gameStartAt, alarm: s.alarm }),
      version: 1,
    }
  )
)

export const useGameInit = () => {
  const load = useGame(s => s.loadSeedTexts)
  const init = useGame(s => s.init)
  init()
  // fire and forget
  // no await in hook body; call and ignore
  load()
}
