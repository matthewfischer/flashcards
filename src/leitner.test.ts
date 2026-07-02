import { describe, it, expect } from 'vitest'
import { applyRating, initialProgress, isDue } from './leitner'
import type { CardProgress } from './types'

describe('initialProgress', () => {
  it('starts a new card in box 1, unseen, and due immediately', () => {
    const p = initialProgress()
    expect(p.box).toBe(1)
    expect(p.seen).toBe(0)
    expect(p.correct).toBe(0)
    expect(isDue(p)).toBe(true)
  })
})

describe('applyRating', () => {
  const base = initialProgress()

  it('"good" promotes the box by one', () => {
    const next = applyRating(base, 'good')
    expect(next.box).toBe(2)
  })

  it('"easy" promotes the box by two', () => {
    const next = applyRating(base, 'easy')
    expect(next.box).toBe(3)
  })

  it('"hard" slips the card back one box', () => {
    const inBox3: CardProgress = { ...base, box: 3 }
    const next = applyRating(inBox3, 'hard')
    expect(next.box).toBe(2)
  })

  it('"hard" cannot drop below box 1', () => {
    const next = applyRating(base, 'hard')
    expect(next.box).toBe(1)
  })

  it('"fair" keeps the card in the same box', () => {
    const inBox3: CardProgress = { ...base, box: 3 }
    const next = applyRating(inBox3, 'fair')
    expect(next.box).toBe(3)
  })

  it('"again" sends the card back to box 1', () => {
    const inBox4: CardProgress = { ...base, box: 4 }
    const next = applyRating(inBox4, 'again')
    expect(next.box).toBe(1)
  })

  it('never promotes above box 5', () => {
    const inBox5: CardProgress = { ...base, box: 5 }
    expect(applyRating(inBox5, 'easy').box).toBe(5)
    expect(applyRating(inBox5, 'good').box).toBe(5)
  })

  it('never drops below box 1', () => {
    const next = applyRating(base, 'again')
    expect(next.box).toBe(1)
  })

  it('counts a correct answer for non-"again" ratings', () => {
    expect(applyRating(base, 'good').correct).toBe(1)
    expect(applyRating(base, 'hard').correct).toBe(1)
    expect(applyRating(base, 'fair').correct).toBe(1)
    expect(applyRating(base, 'easy').correct).toBe(1)
  })

  it('does not count "again" as correct but still increments seen', () => {
    const next = applyRating(base, 'again')
    expect(next.correct).toBe(0)
    expect(next.seen).toBe(1)
  })

  it('increments seen on every rating', () => {
    let p = base
    p = applyRating(p, 'good')
    p = applyRating(p, 'hard')
    expect(p.seen).toBe(2)
  })

  it('"again" makes the card due again within the same session (soon)', () => {
    const next = applyRating(base, 'again')
    const dueInMs = new Date(next.dueAt).getTime() - Date.now()
    // resurfaces within a couple of minutes, not days
    expect(dueInMs).toBeLessThan(5 * 60 * 1000)
  })

  it('a promoted card is scheduled into the future (not due now)', () => {
    const next = applyRating(base, 'good')
    expect(isDue(next)).toBe(false)
  })

  it('records a lastReviewed timestamp', () => {
    const next = applyRating(base, 'good')
    expect(next.lastReviewed).toBeTypeOf('string')
    expect(Number.isNaN(Date.parse(next.lastReviewed!))).toBe(false)
  })
})

describe('isDue', () => {
  it('treats a never-seen card (undefined) as due', () => {
    expect(isDue(undefined)).toBe(true)
  })

  it('is due when dueAt is in the past', () => {
    const past: CardProgress = { ...initialProgress(), dueAt: new Date(Date.now() - 1000).toISOString() }
    expect(isDue(past)).toBe(true)
  })

  it('is not due when dueAt is in the future', () => {
    const future: CardProgress = {
      ...initialProgress(),
      dueAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    }
    expect(isDue(future)).toBe(false)
  })
})
