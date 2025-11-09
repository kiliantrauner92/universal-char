import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame } from '../../state/store'

function renderColored(target: string, typed: string) {
  const spans = [] as JSX.Element[]
  for (let i = 0; i < target.length; i++) {
    const ch = target[i]
    const t = typed[i]
    let cls = ''
    if (t === undefined) cls = 'text-text'
    else if (t === ch) cls = 'text-success'
    else cls = 'text-danger'
    spans.push(
      <span key={i} className={cls} aria-hidden>
        {ch}
      </span>
    )
  }
  return spans
}

export function WelcomeGate() {
  const player = useGame(s => s.player)
  const setPlayer = useGame.setState
  const [typed, setTyped] = useState('')
  const target = 'Welcome'
  const done = player.welcomeComplete
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!done) inputRef.current?.focus()
  }, [done])

  useEffect(() => {
    if (typed === target) {
      setPlayer(s => ({ player: { ...s.player, welcomeComplete: true } }))
    }
  }, [typed, target, setPlayer])

  if (done) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-surface p-6 rounded shadow max-w-lg w-full space-y-4">
        <h1 className="text-2xl font-semibold">Welcome</h1>
        <p className="text-muted">Type the word below to begin.</p>
        <div className="p-4 rounded bg-surface2 font-mono text-lg" aria-label="Welcome typing challenge">
          <div className="mb-2" aria-live="polite">{renderColored(target, typed)}</div>
          <input
            ref={inputRef}
            className="w-full bg-transparent outline-none border-b border-muted py-2"
            aria-label="Type here"
            value={typed}
            onChange={e => setTyped(e.target.value.slice(0, target.length))}
          />
        </div>
      </div>
    </div>
  )
}
