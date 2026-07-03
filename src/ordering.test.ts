import { describe, it, expect } from 'vitest'
import type { Card } from './types'
import {
  orderableCards,
  orderingFamilies,
  canPlayOrdering,
  buildOrderingRounds,
  scoreOrdering,
  type OrderingItem,
} from './ordering'

function card(id: string, vendor: string, category: string, released?: string): Card {
  return { id, term: id, definition: '', vendor, category, released }
}

const deck: Card[] = [
  card('a', 'NVIDIA', 'GPU', '2020'),
  card('b', 'NVIDIA', 'GPU', '2022'),
  card('c', 'NVIDIA', 'GPU', '2024'),
  card('d', 'NVIDIA', 'GPU', '2026'),
  card('e', 'NVIDIA', 'CPU', '2023'), // family too small (1)
  card('f', 'Intel', 'CPU'), // no release date
]

function item(released: string, id = released): OrderingItem {
  return { id, term: id, released, vendor: 'x', category: 'y' }
}

describe('orderableCards', () => {
  it('keeps only cards with a release date', () => {
    expect(orderableCards(deck).map((c) => c.id)).toEqual(['a', 'b', 'c', 'd', 'e'])
  })
})

describe('orderingFamilies', () => {
  it('groups by vendor + category and drops families under 3', () => {
    const fams = orderingFamilies(deck)
    expect([...fams.keys()]).toEqual(['NVIDIA · GPU'])
    expect(fams.get('NVIDIA · GPU')!.length).toBe(4)
  })
})

describe('canPlayOrdering', () => {
  it('is true when a family qualifies', () => {
    expect(canPlayOrdering(deck)).toBe(true)
  })
  it('is false without enough dated cards', () => {
    expect(canPlayOrdering([card('x', 'X', 'Y', '2020')])).toBe(false)
  })
})

describe('buildOrderingRounds', () => {
  it('returns one round per eligible family with all its items', () => {
    const rounds = buildOrderingRounds(deck, () => 0)
    expect(rounds.length).toBe(1)
    const round = rounds[0]
    const years = round.solution.map((i) => i.released)
    expect(years).toEqual([...years].sort())
    expect(round.solution.length).toBe(4)
    expect(round.shuffled.length).toBe(round.solution.length)
    expect([...round.shuffled].map((i) => i.id).sort()).toEqual(
      [...round.solution].map((i) => i.id).sort(),
    )
  })
  it('returns an empty list when nothing qualifies', () => {
    expect(buildOrderingRounds([card('x', 'X', 'Y')])).toEqual([])
  })
})

describe('scoreOrdering', () => {
  it('marks a correct ascending order fully correct', () => {
    const r = scoreOrdering([item('2020'), item('2022'), item('2024')])
    expect(r.correct).toBe(true)
    expect(r.correctCount).toBe(3)
    expect(r.positionOk).toEqual([true, true, true])
  })
  it('flags an out-of-order arrangement', () => {
    const r = scoreOrdering([item('2024'), item('2020'), item('2022')])
    expect(r.correct).toBe(false)
    expect(r.positionOk[0]).toBe(false)
  })
  it('treats shared years as consistent', () => {
    const r = scoreOrdering([item('2024', 'a'), item('2024', 'b'), item('2025', 'c')])
    expect(r.correct).toBe(true)
  })
})
