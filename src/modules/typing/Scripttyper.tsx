import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../state/store'

function CharSpan({ ch, typed }: { ch: string; typed?: string }) {
  let cls = 'text-text'
  if (typed !== undefined) cls = typed === ch ? 'text-success' : 'text-danger'
  return <span className={cls}>{ch}</span>
}

export function Scripttyper() {
  const run = useGame(s => s.run)
  const start = useGame(s => s.startRun)
  const typeChar = useGame(s => s.typeChar)
  const skip = useGame(s => s.skipText)

  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (run.status === 'active') inputRef.current?.focus()
  }, [run.status])

  useEffect(() => {
    if (run.status !== 'active') setInput('')
  }, [run.status])

  const onChange = (v: string) => {
    if (run.status !== 'active' || !run.text) return
    const ch = v.slice(-1) // take the last typed character (we clear after each)
    if (!ch) return
    typeChar(ch)
    setInput('')
  }

  const elapsed = useMemo(() => {
    if (run.status !== 'active' || !run.startedAt) return 0
    return Date.now() - run.startedAt
  }, [run.status, run.startedAt])

  return (
    <section className="bg-surface p-4 rounded">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold">Scripttyper {run.alarm ? <span className="text-info text-sm">ALARM</span> : null}</h2>
        <div className="space-x-2">
          <button className="px-3 py-1 rounded bg-accent text-black" onClick={start} disabled={run.status === 'active'}>
            Start
          </button>
          <button className="px-3 py-1 rounded bg-surface2 border border-muted" onClick={skip} disabled={run.status !== 'active'}>
            Skip
          </button>
        </div>
      </div>

      {run.status === 'active' && run.text ? (
        <div className="space-y-3">
          <div className="text-muted text-sm">{run.text.title} • {run.text.genre}</div>
          <div className="p-4 rounded bg-surface2 font-mono text-lg leading-relaxed">
            {run.text.body.split('').map((ch, i) => (
              <CharSpan key={i} ch={ch} typed={run.typed[i]} />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><div className="text-muted text-sm">Correct</div><div className="text-success text-xl">{run.correct}</div></div>
            <div><div className="text-muted text-sm">Wrong</div><div className="text-danger text-xl">{run.wrong}</div></div>
            <div><div className="text-muted text-sm">Typed</div><div className="text-xl">{run.typed.length}/{run.text.body.length}</div></div>
            <div><div className="text-muted text-sm">Time</div><div className="text-xl">{Math.floor(elapsed/1000)}s</div></div>
          </div>
          <input
            ref={inputRef}
            className="w-0 h-0 opacity-0" aria-hidden value={input} onChange={e => onChange(e.target.value)} />
        </div>
      ) : (
        <p className="text-muted">Press Start to begin typing a random text. You can skip while active.</p>
      )}
    </section>
  )
}
