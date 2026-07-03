import { useState } from 'react'
import type { Card, Rating } from '../types'

interface FlashcardProps {
  card: Card
  index: number
  total: number
  onRate: (rating: Rating) => void
  onDismiss: () => void
}

const RATINGS: { key: Rating; label: string; hint: string }[] = [
  { key: 'again', label: 'Again', hint: 'Forgot' },
  { key: 'hard', label: 'Hard', hint: 'Rough' },
  { key: 'fair', label: 'Fair', hint: 'Effort' },
  { key: 'good', label: 'Good', hint: 'Solid' },
  { key: 'easy', label: 'Easy', hint: 'Instant' },
]

export default function Flashcard({ card, index, total, onRate, onDismiss }: FlashcardProps) {
  const [flipped, setFlipped] = useState(false)

  function handleRate(rating: Rating) {
    setFlipped(false)
    onRate(rating)
  }

  return (
    <div className="card-stage">
      <div className="progress-line">
        <span>
          {index + 1} / {total}
        </span>
        <span className="chips">
          <span className="chip chip-vendor">{card.vendor}</span>
          <span className="chip chip-cat">{card.category}</span>
          {card.released && <span className="chip chip-year">{card.released}</span>}
          {card.roadmap && <span className="chip chip-roadmap">roadmap</span>}
        </span>
      </div>

      <button
        className={`flashcard ${flipped ? 'is-flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label="Flip card"
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <div className="term">{card.term}</div>
            <div className="tap-hint">tap to reveal</div>
          </div>
          <div className="flashcard-face flashcard-back">
            <div className="definition">{card.definition}</div>
            {card.links && card.links.length > 0 && (
              <div className="links">
                {card.links.map((link) => (
                  <a
                    key={link.url}
                    className="card-link"
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {link.label} ↗
                  </a>
                ))}
              </div>
            )}
            {card.tags && card.tags.length > 0 && (
              <div className="tags">{card.tags.map((t) => `#${t}`).join('  ')}</div>
            )}
          </div>
        </div>
      </button>

      {flipped ? (
        <div className="rating-row">
          {RATINGS.map((r) => (
            <button
              key={r.key}
              className={`rate-btn rate-${r.key}`}
              onClick={() => handleRate(r.key)}
            >
              <span className="rate-label">{r.label}</span>
              <span className="rate-hint">{r.hint}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="rating-row rating-row--placeholder">
          <button className="reveal-btn" onClick={() => setFlipped(true)}>
            Reveal answer
          </button>
        </div>
      )}

      <button className="dismiss-btn" onClick={onDismiss} title="Hide this card from future sessions">
        ✕ Not useful — dismiss this card
      </button>
    </div>
  )
}
