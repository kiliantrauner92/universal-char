import { useGame } from '../../state/store'

export function StorePanel() {
  const items = useGame(s => s.visibleItems())
  const buy = useGame(s => s.buyItem)
  const player = useGame(s => s.player)

  return (
    <section className="bg-surface p-4 rounded">
      <h2 className="text-xl font-semibold mb-2">Store</h2>
      {items.length === 0 ? (
        <p className="text-muted">No items available yet. Keep progressing!</p>
      ) : (
        <ul className="space-y-2">
          {items.map(it => {
            const costChars = it.cost.chars ?? 0
            const costMoney = it.cost.money ?? 0
            const can = player.chars >= costChars && player.money >= costMoney
            return (
              <li key={it.id} className="flex items-center justify-between bg-surface2 rounded p-3">
                <div>
                  <div className="font-medium">{it.name}</div>
                  <div className="text-muted text-sm">{it.desc}</div>
                  <div className="text-muted text-xs">Cost: {costChars} chars{costMoney ? `, ${costMoney} money` : ''}</div>
                </div>
                <button
                  className="px-3 py-1 rounded bg-accent text-black disabled:opacity-50"
                  onClick={() => buy(it.id)}
                  disabled={!can}
                  aria-disabled={!can}
                >
                  Buy
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
