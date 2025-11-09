import { Text } from './types'

export async function loadTexts(): Promise<Text[]> {
  const res = await fetch('/data/texts.json')
  if (!res.ok) throw new Error('Failed to load texts')
  const data = (await res.json()) as Text[]
  return data
}
