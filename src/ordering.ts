// ---------------------------------------------------------------------------
// Timeline / ordering quiz logic.
//
// Uses the optional `released` field on cards to build "arrange oldest → newest"
// rounds. Cards are grouped into families (vendor + category) so the items in a
// round are actually comparable (e.g. NVIDIA GPUs, Intel CPUs). Kept pure so it
// is easy to unit-test and independent of React.
// ---------------------------------------------------------------------------

import type { Card } from './types'

/** A single item shown in an ordering round. */
export interface OrderingItem {
  id: string
  term: string
  /** Release date string ("2022" or "2022-03"); compared lexicographically. */
  released: string
  vendor: string
  category: string
}

/** One playable round: a family of items plus a shuffled arrangement. */
export interface OrderingRound {
  /** Human-readable family label, e.g. "NVIDIA · GPU". */
  title: string
  /** Items in the correct order (oldest → newest). */
  solution: OrderingItem[]
  /** The same items shuffled for the user to arrange. */
  shuffled: OrderingItem[]
}

/** Result of scoring a user's arrangement. */
export interface OrderingResult {
  /** True when the arrangement is in non-decreasing release order. */
  correct: boolean
  /** Per-position: true if the item sits consistently with its neighbours. */
  positionOk: boolean[]
  /** Count of positions marked ok (used for a partial score). */
  correctCount: number
}

const MIN_ITEMS = 3

function familyKey(c: Card): string {
  return `${c.vendor} · ${c.category}`
}

function toItem(c: Card): OrderingItem {
  return {
    id: c.id,
    term: c.term,
    released: c.released as string,
    vendor: c.vendor,
    category: c.category,
  }
}

function shuffleWith<T>(arr: T[], rng: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Cards that carry a release date and can therefore be time-ordered. */
export function orderableCards(cards: Card[]): Card[] {
  return cards.filter((c) => typeof c.released === 'string' && c.released.length > 0)
}

/**
 * Group orderable cards into families (vendor + category) that have at least
 * MIN_ITEMS members — the only families that can form a round.
 */
export function orderingFamilies(cards: Card[]): Map<string, Card[]> {
  const groups = new Map<string, Card[]>()
  for (const c of orderableCards(cards)) {
    const key = familyKey(c)
    const arr = groups.get(key) ?? []
    arr.push(c)
    groups.set(key, arr)
  }
  for (const [key, arr] of [...groups]) {
    if (arr.length < MIN_ITEMS) groups.delete(key)
  }
  return groups
}

/** True when at least one family can form an ordering round. */
export function canPlayOrdering(cards: Card[]): boolean {
  return orderingFamilies(cards).size > 0
}

/**
 * Build one round per eligible family, each containing all of that family's
 * dated items. Families are returned in a stable (alphabetical) order so the
 * quiz can simply step through them one at a time.
 */
export function buildOrderingRounds(
  cards: Card[],
  rng: () => number = Math.random,
): OrderingRound[] {
  const families = orderingFamilies(cards)
  return [...families.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([title, members]) => roundFromMembers(title, members, rng))
}

function roundFromMembers(
  title: string,
  members: Card[],
  rng: () => number,
): OrderingRound {
  const solution = [...members]
    .sort((a, b) => (a.released as string).localeCompare(b.released as string))
    .map(toItem)

  // Shuffle, but avoid handing back the already-correct order.
  let shuffled = shuffleWith(solution, rng)
  for (let tries = 0; tries < 8 && isSorted(shuffled); tries++) {
    shuffled = shuffleWith(solution, rng)
  }

  return { title, solution, shuffled }
}

function isSorted(items: OrderingItem[]): boolean {
  return items.every((it, i) => i === 0 || items[i - 1].released <= it.released)
}

/**
 * Score a user's arrangement. An item is "ok" when its release date is
 * consistent with both neighbours (handles items sharing a release year).
 */
export function scoreOrdering(userOrder: OrderingItem[]): OrderingResult {
  const years = userOrder.map((i) => i.released)
  const positionOk = years.map((y, idx) => {
    const prevOk = idx === 0 || years[idx - 1] <= y
    const nextOk = idx === years.length - 1 || y <= years[idx + 1]
    return prevOk && nextOk
  })
  const correct = years.every((y, idx) => idx === 0 || years[idx - 1] <= y)
  const correctCount = positionOk.filter(Boolean).length
  return { correct, positionOk, correctCount }
}
