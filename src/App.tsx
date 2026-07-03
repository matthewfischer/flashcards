import { useMemo, useState } from 'react'
import type { Card, Rating } from './types'
import { VENDORS, CATEGORIES, ALL_CARDS } from './data'
import { useDeck, type DeckFilters } from './useDeck'
import Flashcard from './components/Flashcard'
import OrderingQuiz from './components/OrderingQuiz'
import { buildOrderingRounds, canPlayOrdering, type OrderingRound } from './ordering'

type Screen = 'setup' | 'session' | 'done' | 'manage' | 'order'

const LENGTH_OPTIONS = [
  { label: 'Quick · 10', value: 10 },
  { label: 'Standard · 20', value: 20 },
  { label: 'Long · 40', value: 40 },
  { label: 'All', value: 0 },
]

function MultiSelect({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="filter-group">
      <div className="filter-title">{title}</div>
      <div className="pill-row">
        {options.map((opt) => (
          <button
            key={opt}
            className={`pill ${selected.includes(opt) ? 'pill-on' : ''}`}
            onClick={() => onToggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function App() {
  const deck = useDeck()
  const [screen, setScreen] = useState<Screen>('setup')
  const [vendors, setVendors] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [onlyDue, setOnlyDue] = useState(false)
  const [limit, setLimit] = useState(10)

  const [queue, setQueue] = useState<Card[]>([])
  const [pos, setPos] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)

  const [orderRounds, setOrderRounds] = useState<OrderingRound[]>([])
  const [orderIndex, setOrderIndex] = useState(0)
  const orderingAvailable = useMemo(() => canPlayOrdering(deck.activeCards), [deck.activeCards])

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value])

  function startSession() {
    const filters: DeckFilters = { vendors, categories, onlyDue, limit }
    const q = deck.buildQueue(filters)
    if (q.length === 0) return
    setQueue(q)
    setPos(0)
    setReviewedCount(0)
    setScreen('session')
  }

  function advance() {
    if (pos + 1 >= queue.length) {
      setScreen('done')
    } else {
      setPos((p) => p + 1)
    }
  }

  function handleRate(rating: Rating) {
    const card = queue[pos]
    deck.rateCard(card.id, rating)
    setReviewedCount((c) => c + 1)
    advance()
  }

  function handleDismiss() {
    const card = queue[pos]
    deck.dismissCard(card.id)
    advance()
  }

  function startOrdering() {
    const rounds = buildOrderingRounds(deck.activeCards)
    if (rounds.length === 0) return
    setOrderRounds(rounds)
    setOrderIndex(0)
    setScreen('order')
  }

  const dismissedCards = useMemo(
    () => ALL_CARDS.filter((c) => deck.dismissed.has(c.id)),
    [deck.dismissed],
  )

  const previewCount = useMemo(
    () => deck.buildQueue({ vendors, categories, onlyDue, limit }).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [vendors, categories, onlyDue, limit, deck.dismissed, deck.progress],
  )

  return (
    <div className="app">
      <header className="app-header">
        <h1>H/W Flashcards</h1>
        <p className="tagline">Systems hardware · HPE, CXL, NVIDIA, Intel &amp; AMD</p>
      </header>

      {screen === 'setup' && (
        <main className="setup">
          <div className="stat-row">
            <div className="stat">
              <div className="stat-num">{deck.totalCards}</div>
              <div className="stat-label">total cards</div>
            </div>
            <div className="stat">
              <div className="stat-num">{deck.dueCount}</div>
              <div className="stat-label">due now</div>
            </div>
            <div className="stat">
              <div className="stat-num">{deck.dismissed.size}</div>
              <div className="stat-label">dismissed</div>
            </div>
          </div>

          <MultiSelect
            title="Vendor"
            options={VENDORS}
            selected={vendors}
            onToggle={(v) => toggle(vendors, setVendors, v)}
          />
          <MultiSelect
            title="Technology"
            options={CATEGORIES}
            selected={categories}
            onToggle={(v) => toggle(categories, setCategories, v)}
          />

          <div className="filter-group">
            <div className="filter-title">Session length</div>
            <div className="pill-row">
              {LENGTH_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  className={`pill ${limit === o.value ? 'pill-on' : ''}`}
                  onClick={() => setLimit(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <label className="due-toggle">
            <input
              type="checkbox"
              checked={onlyDue}
              onChange={(e) => setOnlyDue(e.target.checked)}
            />
            Only cards due for review
          </label>

          <button className="start-btn" disabled={previewCount === 0} onClick={startSession}>
            {previewCount === 0 ? 'No cards match' : `Start · ${previewCount} card${previewCount === 1 ? '' : 's'}`}
          </button>

          {orderingAvailable && (
            <button className="start-btn start-btn--alt" onClick={startOrdering}>
              Timeline quiz · arrange oldest → newest
            </button>
          )}

          <div className="footer-links">
            <button className="link-btn" onClick={() => setScreen('manage')}>
              Manage dismissed ({deck.dismissed.size})
            </button>
            <button
              className="link-btn"
              onClick={() => {
                if (confirm('Reset all learning progress? Dismissed cards are kept.')) {
                  deck.resetProgress()
                }
              }}
            >
              Reset progress
            </button>
          </div>
        </main>
      )}

      {screen === 'session' && queue[pos] && (
        <main className="session">
          <Flashcard
            key={queue[pos].id}
            card={queue[pos]}
            index={pos}
            total={queue.length}
            onRate={handleRate}
            onDismiss={handleDismiss}
          />
          <button className="link-btn end-btn" onClick={() => setScreen('done')}>
            End session
          </button>
        </main>
      )}

      {screen === 'order' && orderRounds[orderIndex] && (
        <main className="session">
          <OrderingQuiz
            key={orderIndex}
            round={orderRounds[orderIndex]}
            roundNumber={orderIndex + 1}
            roundTotal={orderRounds.length}
            isLast={orderIndex === orderRounds.length - 1}
            onNext={() => setOrderIndex((i) => i + 1)}
            onExit={() => setScreen('setup')}
          />
        </main>
      )}

      {screen === 'done' && (
        <main className="done">
          <div className="done-check">✓</div>
          <h2>Session complete</h2>
          <p>
            You reviewed <strong>{reviewedCount}</strong> card
            {reviewedCount === 1 ? '' : 's'}.
          </p>
          <p className="muted">{deck.dueCount} cards still due across the deck.</p>
          <button className="start-btn" onClick={() => setScreen('setup')}>
            Back to menu
          </button>
        </main>
      )}

      {screen === 'manage' && (
        <main className="manage">
          <h2>Dismissed cards</h2>
          {dismissedCards.length === 0 ? (
            <p className="muted">Nothing dismissed. Cards you mark “Not useful” appear here.</p>
          ) : (
            <>
              <button className="link-btn" onClick={deck.restoreAll}>
                Restore all
              </button>
              <ul className="dismissed-list">
                {dismissedCards.map((c) => (
                  <li key={c.id}>
                    <span>
                      <strong>{c.term}</strong>
                      <span className="muted"> · {c.vendor} · {c.category}</span>
                    </span>
                    <button className="link-btn" onClick={() => deck.restoreCard(c.id)}>
                      Restore
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <button className="start-btn" onClick={() => setScreen('setup')}>
            Back to menu
          </button>
        </main>
      )}
    </div>
  )
}
