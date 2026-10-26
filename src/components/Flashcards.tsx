import { useState } from 'react'
import quizzesData from '../../data/quizzes.json'

type Card = { q: string; options: string[]; a: number }
type Grade = 'correct' | 'wrong' | null

const quizzes = quizzesData.quizzes as Record<string, Card[]>
const LETTERS = ['A', 'B', 'C', 'D']

/**
 * Flashcards — a short multiple-choice quiz per civilization.
 *
 * Rendered with the supervisor's design language (panel / eyebrow / btn /
 * progress / poi-dots) so it sits inside an info page without looking like a
 * separate app. All quiz state is local and resets when the civ changes.
 */
export default function Flashcards({ civId }: { civId: string }) {
  const cards = quizzes[civId] || []
  const [index, setIndex] = useState(0)
  const [choices, setChoices] = useState<(number | null)[]>(() => cards.map(() => null))
  const [finished, setFinished] = useState(false)

  if (!cards.length) {
    return (
      <p className="muted" style={{ margin: 0 }}>
        No quiz is available for this civilization yet.
      </p>
    )
  }

  const grade = (i: number): Grade =>
    choices[i] === null ? null : choices[i] === cards[i].a ? 'correct' : 'wrong'

  const card = cards[index]
  const selected = choices[index]
  const answered = selected !== null
  const score = cards.filter((_, i) => grade(i) === 'correct').length
  const answeredCount = choices.filter((c) => c !== null).length
  const done = answeredCount === cards.length

  const choose = (optionIndex: number) => {
    if (answered) return
    const next = [...choices]
    next[index] = optionIndex
    setChoices(next)
  }

  const goTo = (i: number) => {
    setIndex(Math.max(0, Math.min(cards.length - 1, i)))
  }

  const reset = () => {
    setIndex(0)
    setChoices(cards.map(() => null))
    setFinished(false)
  }

  /* ---------------------------------------------------------------- result */

  if (done || finished) {
    const perfect = score === cards.length
    return (
      <div className="fade-in" style={{ textAlign: 'center', clear: 'both' }}>
        <span className="eyebrow" style={{ marginBottom: 4 }}>
          Flashcards complete
        </span>
        <h2 style={{ margin: '0 0 6px' }}>
          {perfect ? 'Perfect score' : score >= cards.length / 2 ? 'Well done' : 'Keep exploring'}
        </h2>
        <p className="lead" style={{ margin: '0 auto 6px', textAlign: 'center' }}>
          You answered{' '}
          <strong style={{ color: 'var(--gold)' }}>
            {score} of {cards.length}
          </strong>{' '}
          correctly.
        </p>
        <p className="muted" style={{ margin: '0 0 20px' }}>
          {perfect
            ? 'You know this civilization inside out.'
            : score >= cards.length / 2
              ? 'Review the sections above to master the ones you missed.'
              : 'Read through the sections above, then try the quiz again.'}
        </p>
        <div className="result-actions" style={{ justifyContent: 'center', marginTop: 0 }}>
          <button type="button" className="btn btn-gold" onClick={reset}>
            Restart quiz
          </button>
          <a className="btn btn-outline" href={`#/civ/${civId}/info/overview`}>
            Review overview
          </a>
        </div>
      </div>
    )
  }

  /* --------------------------------------------------------------- question */

  return (
    <div className="fade-in" style={{ clear: 'both' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 12,
        }}
      >
        <span className="eyebrow" style={{ margin: 0 }}>
          Question {index + 1} of {cards.length}
        </span>
        <span className="pill medium">Score: {score}</span>
      </div>

      <div className="progress" style={{ marginTop: 0, marginBottom: 22 }}>
        <div style={{ width: `${(answeredCount / cards.length) * 100}%` }} />
      </div>

      <div className="panel">
        <h3 style={{ marginBottom: '.5em' }}>{card.q}</h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
          {card.options.map((opt, i) => {
            const isCorrect = i === card.a
            const isChosen = selected === i

            const border = answered
              ? isCorrect
                ? 'var(--jade)'
                : isChosen
                  ? 'var(--danger)'
                  : 'var(--line)'
              : 'var(--line)'
            const background = answered
              ? isCorrect
                ? 'rgba(47, 107, 85, .1)'
                : isChosen
                  ? 'rgba(176, 58, 46, .08)'
                  : 'transparent'
              : 'transparent'
            const colour = answered
              ? isCorrect
                ? 'var(--jade)'
                : isChosen
                  ? 'var(--danger)'
                  : 'var(--ink-3)'
              : 'var(--ink)'

            return (
              <button
                key={i}
                type="button"
                onClick={() => choose(i)}
                disabled={answered}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: 12,
                  border: `1.5px solid ${border}`,
                  background,
                  color: colour,
                  font: 'inherit',
                  fontSize: '.98rem',
                  textAlign: 'left',
                  cursor: answered ? 'default' : 'pointer',
                  transition: 'border-color .2s, background .2s, color .2s',
                }}
              >
                <span
                  style={{
                    width: 30,
                    height: 30,
                    flex: 'none',
                    borderRadius: 8,
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '.82rem',
                    fontWeight: 700,
                    background: answered && isCorrect ? 'var(--jade)' : 'var(--sand)',
                    color: answered && isCorrect ? '#fff' : 'var(--ink-2)',
                  }}
                >
                  {LETTERS[i]}
                </span>
                <span style={{ fontWeight: 500 }}>{opt}</span>
                {answered && isCorrect ? (
                  <span style={{ marginLeft: 'auto', color: 'var(--jade)', fontWeight: 700 }}>✓</span>
                ) : null}
                {answered && isChosen && !isCorrect ? (
                  <span style={{ marginLeft: 'auto', color: 'var(--danger)', fontWeight: 700 }}>✗</span>
                ) : null}
              </button>
            )
          })}
        </div>
      </div>

      <div className="poi-dots" style={{ marginTop: 16 }}>
        {choices.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Go to question ${i + 1}`}
            className={i === index ? 'active' : ''}
            style={
              grade(i) === 'correct'
                ? { background: 'var(--jade)' }
                : grade(i) === 'wrong'
                  ? { background: 'var(--danger)' }
                  : undefined
            }
          />
        ))}
      </div>

      <div className="result-actions" style={{ justifyContent: 'space-between', marginTop: 22 }}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
        >
          ← Previous
        </button>

        {!answered ? (
          <span className="muted" style={{ fontSize: '.86rem', alignSelf: 'center' }}>
            Choose an answer to continue
          </span>
        ) : index === cards.length - 1 ? (
          <button type="button" className="btn btn-gold" onClick={() => setFinished(true)}>
            See results
          </button>
        ) : (
          <button type="button" className="btn btn-gold" onClick={() => goTo(index + 1)}>
            Next →
          </button>
        )}
      </div>
    </div>
  )
}
