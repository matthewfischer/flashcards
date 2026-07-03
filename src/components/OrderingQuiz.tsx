import { useState } from 'react'
import type { OrderingItem, OrderingRound } from '../ordering'
import { scoreOrdering } from '../ordering'

interface OrderingQuizProps {
  round: OrderingRound
  roundNumber: number
  roundTotal: number
  isLast: boolean
  onNext: () => void
  onExit: () => void
}

export default function OrderingQuiz({
  round,
  roundNumber,
  roundTotal,
  isLast,
  onNext,
  onExit,
}: OrderingQuizProps) {
  const [order, setOrder] = useState<OrderingItem[]>(round.shuffled)
  const [submitted, setSubmitted] = useState(false)

  const result = submitted ? scoreOrdering(order) : null

  function move(index: number, dir: -1 | 1) {
    if (submitted) return
    const target = index + dir
    if (target < 0 || target >= order.length) return
    setOrder((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  return (
    <div className="card-stage">
      <div className="progress-line">
        <span>
          {roundNumber} / {roundTotal} · Arrange oldest → newest
        </span>
        <span className="chips">
          <span className="chip chip-vendor">{round.title}</span>
        </span>
      </div>

      <ol className="order-list">
        {order.map((item, i) => {
          const ok = result?.positionOk[i]
          const state = result ? (ok ? 'order-item--ok' : 'order-item--bad') : ''
          return (
            <li key={item.id} className={`order-item ${state}`}>
              <span className="order-rank">{i + 1}</span>
              <span className="order-term">
                {item.term}
                {submitted && <span className="order-year"> · {item.released}</span>}
              </span>
              {!submitted && (
                <span className="order-moves">
                  <button
                    className="order-move"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move earlier"
                  >
                    ↑
                  </button>
                  <button
                    className="order-move"
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    aria-label="Move later"
                  >
                    ↓
                  </button>
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {!submitted ? (
        <div className="rating-row rating-row--placeholder">
          <button className="reveal-btn" onClick={() => setSubmitted(true)}>
            Check order
          </button>
        </div>
      ) : (
        <div className="order-feedback">
          <div className={`order-verdict ${result?.correct ? 'is-correct' : 'is-wrong'}`}>
            {result?.correct
              ? '✓ Perfect — correct timeline!'
              : `${result?.correctCount} / ${order.length} in place`}
          </div>
          {!result?.correct && (
            <div className="order-solution">
              <div className="order-solution-title">Correct order</div>
              <ol className="order-solution-list">
                {round.solution.map((item) => (
                  <li key={item.id}>
                    <span className="order-term">{item.term}</span>
                    <span className="order-year"> · {item.released}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div className="rating-row rating-row--placeholder">
            <button className="reveal-btn" onClick={isLast ? onExit : onNext}>
              {isLast ? 'Finish' : 'Next timeline'}
            </button>
          </div>
        </div>
      )}

      <button className="link-btn end-btn" onClick={onExit}>
        Back to menu
      </button>
    </div>
  )
}
