import { useState } from 'react'
import quizzesData from '../../data/quizzes.json'

type Answer = 'correct' | 'wrong' | null

const quizzes = quizzesData.quizzes as Record<string, { q: string; a: string }[]>

export default function Flashcards({ civId }: { civId: string }) {
  const cards = quizzes[civId] || []
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>(() => cards.map(() => null))

  if (!cards.length) {
    return <p className="text-ink-3 text-sm">No quiz available for this civilization.</p>
  }

  const card = cards[index]
  const score = answers.filter(a => a === 'correct').length
  const answeredCount = answers.filter(a => a !== null).length
  const done = answeredCount === cards.length

  const mark = (value: 'correct' | 'wrong') => {
    const next = [...answers]
    next[index] = value
    setAnswers(next)
    if (index < cards.length - 1) {
      setIndex(index + 1)
      setRevealed(false)
    } else {
      setRevealed(false)
    }
  }

  const goTo = (i: number) => {
    setIndex(Math.max(0, Math.min(cards.length - 1, i)))
    setRevealed(false)
  }

  const reset = () => {
    setIndex(0)
    setRevealed(false)
    setAnswers(cards.map(() => null))
  }

  if (done) {
    const perfect = score === cards.length
    return (
      <div className="animate-fade-in text-center py-6">
        <div className="text-5xl mb-4">{perfect ? '🏆' : score >= cards.length / 2 ? '📜' : '🏺'}</div>
        <h3 className="text-2xl font-bold text-ink mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
          Quiz Complete!
        </h3>
        <p className="text-ink-2 mb-1">
          You scored{' '}
          <span className="text-accent font-bold text-xl">
            {score}/{cards.length}
          </span>
        </p>
        <p className="text-ink-3 text-sm mb-6">
          {perfect
            ? 'Perfect score — you know this civilization inside out!'
            : score >= cards.length / 2
              ? 'Good work — review the missed cards to master them.'
              : 'Keep exploring the sections above, then try again!'}
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold rounded-xl hover:from-amber-400 hover:to-orange-500 transition-all cursor-pointer"
        >
          Restart Quiz
        </button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Header: progress + score */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink-2">
            Card <span className="text-accent font-bold">{index + 1}</span> of {cards.length}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/30">
            Score: {score}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {answers.map((a, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to card ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                a === 'correct'
                  ? 'bg-forest'
                  : a === 'wrong'
                    ? 'bg-danger'
                    : i === index
                      ? 'bg-accent'
                      : 'bg-line-2'
              } ${i === index ? 'scale-125' : ''}`}
            />
          ))}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-panel-2 mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
          style={{ width: `${(answeredCount / cards.length) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8 min-h-[200px] flex flex-col">
        <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-3">Question</p>
        <p className="text-ink text-lg sm:text-xl font-semibold leading-relaxed mb-6">{card.q}</p>

        {revealed && (
          <div className="animate-fade-in rounded-xl border border-accent/30 bg-accent/5 p-4 mb-2">
            <p className="text-accent text-xs font-semibold tracking-widest uppercase mb-2">Answer</p>
            <p className="text-ink text-base leading-relaxed">{card.a}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="px-4 py-2.5 rounded-xl border border-line bg-panel text-ink-2 text-sm font-medium hover:text-ink hover:border-accent/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black text-sm font-bold hover:from-amber-400 hover:to-orange-500 transition-all cursor-pointer"
          >
            Show Answer
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => mark('wrong')}
              className="px-4 py-2.5 rounded-xl border border-danger/40 bg-danger/10 text-danger text-sm font-semibold hover:bg-danger/20 transition-all cursor-pointer"
            >
              Missed it
            </button>
            <button
              onClick={() => mark('correct')}
              className="px-4 py-2.5 rounded-xl border border-forest/40 bg-forest/10 text-forest text-sm font-semibold hover:bg-forest/20 transition-all cursor-pointer"
            >
              Got it ✓
            </button>
          </div>
        )}

        <button
          onClick={() => goTo(index + 1)}
          disabled={index === cards.length - 1}
          className="px-4 py-2.5 rounded-xl border border-line bg-panel text-ink-2 text-sm font-medium hover:text-ink hover:border-accent/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
