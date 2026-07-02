import type { Card } from '../types'

// ---------------------------------------------------------------------------
// Data loader.
//
// Every *.json file in this folder is discovered automatically at build time.
// To add or edit cards, just create/modify a JSON file here — no code changes
// required. This is the seam that keeps app logic separate from the data.
// ---------------------------------------------------------------------------

const modules = import.meta.glob<{ default: Card[] }>('./*.json', { eager: true })

function loadAllCards(): Card[] {
  const all: Card[] = []
  const seen = new Set<string>()

  for (const [path, mod] of Object.entries(modules)) {
    const cards = mod.default
    if (!Array.isArray(cards)) {
      console.warn(`[data] ${path} did not export an array; skipping.`)
      continue
    }
    for (const card of cards) {
      if (seen.has(card.id)) {
        console.warn(`[data] duplicate card id "${card.id}" in ${path}; skipping.`)
        continue
      }
      seen.add(card.id)
      all.push(card)
    }
  }
  return all
}

export const ALL_CARDS: Card[] = loadAllCards()

export const VENDORS: string[] = [...new Set(ALL_CARDS.map((c) => c.vendor))].sort()

export const CATEGORIES: string[] = [...new Set(ALL_CARDS.map((c) => c.category))].sort()
