import type { CardProgress } from './types'

// ---------------------------------------------------------------------------
// localStorage persistence. Keeps learning progress and the "dismissed" list
// so sessions resume where you left off and hidden cards stay hidden.
// ---------------------------------------------------------------------------

const PROGRESS_KEY = 'hwflash.progress.v1'
const DISMISSED_KEY = 'hwflash.dismissed.v1'

export type ProgressMap = Record<string, CardProgress>

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function loadProgress(): ProgressMap {
  return safeParse<ProgressMap>(localStorage.getItem(PROGRESS_KEY), {})
}

export function saveProgress(map: ProgressMap): void {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(map))
}

export function loadDismissed(): Set<string> {
  return new Set(safeParse<string[]>(localStorage.getItem(DISMISSED_KEY), []))
}

export function saveDismissed(ids: Set<string>): void {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]))
}
