import { useGame } from '../../state/store'

export function Scoreboard() {
  const player = useGame(s => s.player)
  const pages = Math.floor(player.lifetimeChars / 1000)
  const books = Math.floor(player.lifetimeChars / 1_000_000)
  return (
    <section className="bg-surface p-4 rounded">
      <h2 className="text-xl font-semibold mb-2">Scoreboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-muted text-sm">Chars (currency)</div>
          <div className="text-2xl">{player.chars.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted text-sm">Lifetime Chars</div>
          <div className="text-2xl">{player.lifetimeChars.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted text-sm">Pages</div>
          <div className="text-2xl">{pages.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted text-sm">Books</div>
          <div className="text-2xl">{books.toLocaleString()}</div>
        </div>
      </div>
    </section>
  )
}
