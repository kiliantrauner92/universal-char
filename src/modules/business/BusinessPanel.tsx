import { useGame } from '../../state/store'

export function BusinessPanel() {
  const p = useGame(s => s.player)
  const craftArticle = useGame(s => s.craftArticle)
  const craftBook = useGame(s => s.craftBook)
  const sellArticle = useGame(s => s.sellArticle)
  const sellBook = useGame(s => s.sellBook)
  const adjustPrice = useGame(s => s.adjustPrice)

  return (
    <section className="bg-surface p-4 rounded">
      <h2 className="text-xl font-semibold mb-2">Business</h2>
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <div className="text-muted text-sm">Money</div>
          <div className="text-2xl">{p.money.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted text-sm">Skips</div>
          <div className="text-2xl">{p.skips}</div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-3 rounded bg-surface2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Articles</div>
              <div className="text-muted text-sm">Inventory: {p.inventory.articles}</div>
              <div className="text-muted text-xs">Price: {p.prices.article}
                <span className="ml-2 inline-flex gap-1">
                  <button className="px-2 py-0.5 bg-surface border border-muted rounded" onClick={() => adjustPrice('article', 'down')}>-</button>
                  <button className="px-2 py-0.5 bg-surface border border-muted rounded" onClick={() => adjustPrice('article', 'up')}>+</button>
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-accent text-black" onClick={() => craftArticle(1)}>Craft</button>
              <button className="px-3 py-1 rounded bg-surface border border-muted" onClick={() => sellArticle(1)} disabled={p.inventory.articles===0}>Sell</button>
            </div>
          </div>
        </div>

        <div className="p-3 rounded bg-surface2">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Books</div>
              <div className="text-muted text-sm">Inventory: {p.inventory.books}</div>
              <div className="text-muted text-xs">Price: {p.prices.book}
                <span className="ml-2 inline-flex gap-1">
                  <button className="px-2 py-0.5 bg-surface border border-muted rounded" onClick={() => adjustPrice('book', 'down')}>-</button>
                  <button className="px-2 py-0.5 bg-surface border border-muted rounded" onClick={() => adjustPrice('book', 'up')}>+</button>
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 rounded bg-accent text-black" onClick={() => craftBook(1)}>Craft</button>
              <button className="px-3 py-1 rounded bg-surface border border-muted" onClick={() => sellBook(1)} disabled={p.inventory.books===0}>Sell</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
