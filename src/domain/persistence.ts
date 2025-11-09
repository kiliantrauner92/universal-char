import { SaveGame } from './types'

const KEY = 'universal-char-save-v1'

export function saveState(save: SaveGame) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save))
  } catch {}
}

export function loadState(): SaveGame | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && parsed.version === 1) return parsed as SaveGame
    return null
  } catch {
    return null
  }
}
