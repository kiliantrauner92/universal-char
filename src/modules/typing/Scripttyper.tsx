import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../state/store'

function CharSpan({ ch, typed, current }: { ch: string; typed?: string; current?: boolean }) {
  let cls = 'text-text'
  if (typed !== undefined) {
    cls = typed === ch ? 'text-success' : 'text-danger'
  } else if (current) {
    // highlight next-to-type character; ensure visibility even for spaces
    cls = 'text-text underline decoration-accent decoration-2 underline-offset-4 inline-block border-b-2 border-accent min-w-[0.5ch]'
  }
  return <span className={cls}>{ch === ' ' && current ? '\u00A0' : ch}</span>
}

export function Scripttyper() {
  const run = useGame(s => s.run)
  const player = useGame(s => s.player)
  const items = useGame(s => s.items)
  const hasTexts = useGame(s => s.texts.length > 0)
  const start = useGame(s => s.startRun)
  const typeChar = useGame(s => s.typeChar)
  const skip = useGame(s => s.skipText)
  const alarm = useGame(s => s.alarm)
  const tickAlarm = useGame(s => s.tickAlarm)
  const maybeTriggerAlarms = useGame(s => s.maybeTriggerAlarms)
  const lastAward = useGame(s => s.lastAward)

  const unlimited = items.some(i => i.owned && i.effect.type === 'skip_unlimited')

  const [input, setInput] = useState('')
  const [showAward, setShowAward] = useState(false)
  const [tick, setTick] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Always keep a text open when possible (after welcome complete and no pending alarm)
  useEffect(() => {
    if (player.welcomeComplete && !alarm.pending && run.status === 'idle' && hasTexts) start()
  }, [player.welcomeComplete, alarm.pending, run.status, hasTexts, start])

  // Focus typing input when active
  useEffect(() => {
    if (run.status === 'active') inputRef.current?.focus()
    else setInput('')
  }, [run.status])

  // Time limit auto-complete for ALARM runs
  useEffect(() => {
    if (run.status !== 'active' || !run.startedAt || !run.timeLimitSec) return
    const id = setInterval(() => {
      const elapsed = Date.now() - (run.startedAt ?? 0)
      if (elapsed / 1000 >= (run.timeLimitSec ?? 0)) {
        useGame.getState().completeRun()
      }
    }, 200)
    return () => clearInterval(id)
  }, [run.status, run.startedAt, run.timeLimitSec])

  // Alarm countdown ticker
  useEffect(() => {
    if (!alarm.pending) return
    const id = setInterval(() => tickAlarm(), 1000)
    return () => clearInterval(id)
  }, [alarm.pending, tickAlarm])

  // Periodically check alarm checkpoints (e.g., 10-minute trigger)
  useEffect(() => {
    const id = setInterval(() => maybeTriggerAlarms(), 5000)
    return () => clearInterval(id)
  }, [maybeTriggerAlarms])

  // Show award animation when lastAward changes
  useEffect(() => {
    if (!lastAward) return
    setShowAward(true)
    const t = setTimeout(() => setShowAward(false), 1500)
    return () => clearTimeout(t)
  }, [lastAward?.ts])

  const onChange = (v: string) => {
    if (run.status !== 'active' || !run.text) return
    const ch = v.slice(-1)
    if (!ch) return
    typeChar(ch)
    setInput('')
  }

  // Global key capture so the player can type without focusing an input
  useEffect(() => {
    if (run.status !== 'active' || !run.text || alarm.pending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key.length === 1) {
        e.preventDefault()
        typeChar(e.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [run.status, run.text, alarm.pending, typeChar])

  // drive a periodic re-render while active
  useEffect(() => {
    if (run.status !== 'active' || !run.startedAt) return
    const id = setInterval(() => setTick(t => (t + 1) % 100000), 250)
    return () => clearInterval(id)
  }, [run.status, run.startedAt])

  const elapsed = useMemo(() => {
    if (run.status !== 'active' || !run.startedAt) return 0
    return Date.now() - run.startedAt
  }, [run.status, run.startedAt, tick])

  return (
    <section className="relative bg-surface p-4 rounded">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Scripttyper {run.alarm ? <span className="text-info text-sm">ALARM</span> : null}</h2>
        <div className="space-x-2">
          <button className="px-3 py-1 rounded bg-surface2 border border-muted disabled:opacity-50" onClick={skip} disabled={alarm.pending || (!unlimited && player.skips <= 0)}>
            Skip {unlimited ? '' : `(${player.skips})`}
          </button>
        </div>
      </div>

      {/* Alarm countdown overlay */}
      {alarm.pending ? (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-10">
          <div className="text-info text-6xl font-extrabold">{alarm.countdown}</div>
          <div className="mt-2 text-muted">ALARM incoming: 30s time limit, extra bonus</div>
        </div>
      ) : null}

      {!hasTexts ? (
        <p className="text-muted">Loading texts...</p>
      ) : player.paper <= 0 ? (
        <p className="text-muted">Out of paper. Buy more in Business.</p>
      ) : run.status === 'active' && run.text ? (
        <div className="space-y-3">
          <div className="text-muted text-sm">{run.text.title} • {run.text.genre}</div>
          <div className="p-4 rounded bg-surface2 font-mono text-lg leading-relaxed">
            {run.text.body.split('').map((ch, i) => (
              <CharSpan key={i} ch={ch} typed={run.typed[i]} current={i === run.typed.length} />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div><div className="text-muted text-sm">Correct</div><div className="text-success text-xl">{run.correct}</div></div>
            <div><div className="text-muted text-sm">Wrong</div><div className="text-danger text-xl">{run.wrong}</div></div>
            <div><div className="text-muted text-sm">Typed</div><div className="text-xl">{run.typed.length}/{run.text.body.length}</div></div>
            <div><div className="text-muted text-sm">Time</div><div className="text-xl">{Math.floor(elapsed/1000)}s{run.timeLimitSec ? ` / ${run.timeLimitSec}s` : ''}</div></div>
            <div>
              <div className="text-muted text-sm">Earned</div>
              <div className={showAward ? "text-accent text-xl animate-pulse" : "text-muted text-xl"}>
                {showAward && lastAward ? `+${lastAward.amount}` : '\u00A0'}
              </div>
            </div>
          </div>
          <input
            ref={inputRef}
            className="w-0 h-0 opacity-0" aria-hidden value={input} onChange={e => onChange(e.target.value)} />
        </div>
      ) : (
        <p className="text-muted">Waiting for the next text...</p>
      )}
    </section>
  )
}
