// ---------------------------------------------------------------------------
// Data model — kept intentionally simple so cards can be authored in plain JSON
// without touching any application logic.
// ---------------------------------------------------------------------------

export type Difficulty = 'foundational' | 'intermediate' | 'advanced'

/** An external reference shown on the back of a card for "more info". */
export interface CardLink {
  /** Human-readable text for the link. */
  label: string
  /** Destination URL (opens in the user's real browser). */
  url: string
}

/** A single flashcard as authored in the data/*.json files. */
export interface Card {
  /** Stable unique id. Used for progress + dismiss tracking. */
  id: string
  /** Front of the card — the term or acronym. */
  term: string
  /** Back of the card — the explanation. */
  definition: string
  /** Who makes / owns it (HPE, NVIDIA, Intel, AMD, CXL Consortium, Industry, ...). */
  vendor: string
  /** Technology grouping (Servers, GPU, CPU, Interconnect, Memory, ...). */
  category: string
  /** Optional free-form tags for finer filtering. */
  tags?: string[]
  /** Optional links to docs / specs for deeper reading. */
  links?: CardLink[]
  difficulty?: Difficulty
  /** Optional: mark forward-looking items so the UI can flag them. */
  roadmap?: boolean
  /**
   * Optional release date, added only where a product has a meaningful launch
   * date (chips, CPUs, GPUs, systems). Concepts/standards can omit it.
   * Use a year ("2022") or year-month ("2022-03"); sorts lexicographically.
   */
  released?: string
}

/** The five Leitner boxes. Box 1 = review most often, Box 5 = mastered. */
export type LeitnerBox = 1 | 2 | 3 | 4 | 5

/** Per-card learning state, persisted to localStorage. */
export interface CardProgress {
  box: LeitnerBox
  /** ISO timestamp the card is next eligible for review. */
  dueAt: string
  /** Count of correct / incorrect answers over time. */
  seen: number
  correct: number
  lastReviewed?: string
}

export type Rating = 'again' | 'hard' | 'fair' | 'good' | 'easy'
