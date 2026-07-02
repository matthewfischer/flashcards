import type { CardProgress, LeitnerBox, Rating } from './types'

// ---------------------------------------------------------------------------
// Leitner-box spaced repetition.
//
// Each card lives in a box (1..5). Getting a card right promotes it to a
// higher box that is reviewed less often; getting it wrong sends it back to
// box 1. The delay before a card is due again grows with the box number.
// ---------------------------------------------------------------------------

/** Days until a card in the given box is due again. */
const BOX_INTERVAL_DAYS: Record<LeitnerBox, number> = {
  1: 0, // same session / today
  2: 1,
  3: 3,
  4: 7,
  5: 16,
}

export function initialProgress(): CardProgress {
  return {
    box: 1,
    dueAt: new Date().toISOString(),
    seen: 0,
    correct: 0,
  }
}

function clampBox(box: number): LeitnerBox {
  return Math.max(1, Math.min(5, box)) as LeitnerBox
}

/** Apply a self-rating to a card's progress and return the new state. */
export function applyRating(prev: CardProgress, rating: Rating): CardProgress {
  const now = new Date()
  let box = prev.box

  switch (rating) {
    case 'again':
      box = 1
      break
    case 'hard':
      box = clampBox(prev.box - 1) // slip back one box
      break
    case 'fair':
      box = clampBox(prev.box) // stays in place
      break
    case 'good':
      box = clampBox(prev.box + 1)
      break
    case 'easy':
      box = clampBox(prev.box + 2)
      break
  }

  const intervalDays = BOX_INTERVAL_DAYS[box]
  const due = new Date(now)
  // "again" should resurface within the same session, not a full day later.
  if (rating === 'again') {
    due.setMinutes(due.getMinutes() + 1)
  } else {
    due.setDate(due.getDate() + intervalDays)
  }

  const wasCorrect = rating !== 'again'
  return {
    box,
    dueAt: due.toISOString(),
    seen: prev.seen + 1,
    correct: prev.correct + (wasCorrect ? 1 : 0),
    lastReviewed: now.toISOString(),
  }
}

/** Is a card due for review right now? */
export function isDue(progress: CardProgress | undefined, now = new Date()): boolean {
  if (!progress) return true // never seen => always due
  return new Date(progress.dueAt).getTime() <= now.getTime()
}
