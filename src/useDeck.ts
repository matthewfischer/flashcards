import { useCallback, useMemo, useState } from 'react'
import type { Card, Rating } from './types'
import { ALL_CARDS } from './data'
import {
  loadProgress,
  saveProgress,
  loadDismissed,
  saveDismissed,
  type ProgressMap,
} from './storage'
import { applyRating, initialProgress, isDue } from './leitner'

export interface DeckFilters {
  vendors: string[] // empty = all
  categories: string[] // empty = all
  onlyDue: boolean
  limit: number // 0 = no limit
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function useDeck() {
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress())
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed())

  const activeCards = useMemo(
    () => ALL_CARDS.filter((c) => !dismissed.has(c.id)),
    [dismissed],
  )

  const dueCount = useMemo(
    () => activeCards.filter((c) => isDue(progress[c.id])).length,
    [activeCards, progress],
  )

  /** Build an ordered study queue from the given filters. */
  const buildQueue = useCallback(
    (filters: DeckFilters): Card[] => {
      let pool = activeCards
      if (filters.vendors.length) {
        pool = pool.filter((c) => filters.vendors.includes(c.vendor))
      }
      if (filters.categories.length) {
        pool = pool.filter((c) => filters.categories.includes(c.category))
      }
      if (filters.onlyDue) {
        pool = pool.filter((c) => isDue(progress[c.id]))
      }
      // Prioritise cards in lower Leitner boxes (weaker recall) first, then shuffle within.
      const byBox = shuffle(pool).sort((a, b) => {
        const ba = progress[a.id]?.box ?? 1
        const bb = progress[b.id]?.box ?? 1
        return ba - bb
      })
      return filters.limit > 0 ? byBox.slice(0, filters.limit) : byBox
    },
    [activeCards, progress],
  )

  const rateCard = useCallback((cardId: string, rating: Rating) => {
    setProgress((prev) => {
      const current = prev[cardId] ?? initialProgress()
      const next = { ...prev, [cardId]: applyRating(current, rating) }
      saveProgress(next)
      return next
    })
  }, [])

  const dismissCard = useCallback((cardId: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(cardId)
      saveDismissed(next)
      return next
    })
  }, [])

  const restoreCard = useCallback((cardId: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.delete(cardId)
      saveDismissed(next)
      return next
    })
  }, [])

  const restoreAll = useCallback(() => {
    setDismissed(() => {
      const next = new Set<string>()
      saveDismissed(next)
      return next
    })
  }, [])

  const resetProgress = useCallback(() => {
    setProgress(() => {
      const next: ProgressMap = {}
      saveProgress(next)
      return next
    })
  }, [])

  return {
    progress,
    dismissed,
    activeCards,
    dueCount,
    totalCards: ALL_CARDS.length,
    buildQueue,
    rateCard,
    dismissCard,
    restoreCard,
    restoreAll,
    resetProgress,
  }
}
