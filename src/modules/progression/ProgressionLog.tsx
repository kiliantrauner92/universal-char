import { useGame } from '../../state/store'

export function ProgressionLog() {
  const logs = useGame(s => s.logs)
  return (
    <section className="bg-surface p-4 rounded">
      <h2 className="text-xl font-semibold mb-2">Progression</h2>
      <div className="bg-surface2 rounded p-3 h-40 overflow-auto" role="log" aria-live="polite">
        {logs.length === 0 ? (
          <div className="text-muted">No events yet.</div>
        ) : (
          <ul className="space-y-1 text-sm">
            {logs.slice().reverse().map(e => (
              <li key={e.id}>
                <span className="text-muted mr-2">{new Date(e.ts).toLocaleTimeString()}</span>
                {e.message}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
