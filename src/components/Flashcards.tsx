import { useState } from 'react'
import quizzesData from '../../data/quizzes.json'

type Card = { q: string; options: string[]; a: number }
type Grade = 'correct' | 'wrong' | null

const quizzes = quizzesData.quizzes as Record<string, Card[]>
const LETTERS = ['A', 'B', 'C', 'D']

export default function Flashcards({ civId }: { civId: string }) {
  const cards = quizzes[civId] || []
  const [index, setIndex] = useState(0)
  const [choices, setChoices] = useState<(number | null)[]>(() => cards.map(() => null))

  if (!cards.length) {
    return <p className="text-ink-3 text-base">No quiz available for this civilization.</p>
  }

  const grade = (i: number): Grade =>
    choices[i] === null ? null : choices[i] === cards[i].a ? 'correct' : 'wrong'

  const card = cards[index]
  const selected = choices[index]
  const answered = selected !== null
  const score = cards.filter((_, i) => grade(i) === 'correct').length
  const answeredCount = choices.filter(c => c !== null).length
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
        <p className="text-ink-3 text-base mb-6">
          {perfect
            ? 'Perfect score — you know this civilization inside out!'
            : score >= cards.length / 2
              ? 'Good work — review the missed answers to master them.'
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
          <span className="text-base text-ink-2">
            Question <span className="text-accent font-bold">{index + 1}</span> of {cards.length}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-sm font-semibold bg-accent/10 text-accent border border-accent/30">
            Score: {score}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {choices.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to question ${i + 1}`}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                grade(i) === 'correct'
                  ? 'bg-forest'
                  : grade(i) === 'wrong'
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

      {/* Question */}
      <div className="rounded-2xl border border-line bg-panel p-6 sm:p-8">
        <p className="text-accent text-sm font-semibold tracking-widest uppercase mb-3">Question {index + 1}</p>
        <p className="text-ink text-xl sm:text-2xl font-semibold leading-relaxed mb-6">{card.q}</p>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {card.options.map((opt, i) => {
            const isCorrect = i === card.a
            const isChosen = selected === i
            let cls =
              'border-line bg-panel-2 text-ink-2 hover:border-accent/40 hover:text-ink'
            if (answered) {
              if (isCorrect) cls = 'border-forest/60 bg-forest/10 text-forest'
              else if (isChosen) cls = 'border-danger/60 bg-danger/10 text-danger'
              else cls = 'border-line bg-panel-2 text-ink-4 opacity-60'
            }
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={answered}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all cursor-pointer disabled:cursor-default ${cls}`}
              >
                <span
                  className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold ${
                    answered && isCorrect
                      ? 'bg-forest/20 text-forest'
                      : answered && isChosen
                        ? 'bg-danger/20 text-danger'
                        : 'bg-accent/10 text-accent'
                  }`}
                >
                  {LETTERS[i]}
                </span>
                <span className="text-base sm:text-lg font-medium">{opt}</span>
                {answered && isCorrect && <span className="ml-auto text-forest text-base">✓</span>}
                {answered && isChosen && !isCorrect && <span className="ml-auto text-danger text-base">✗</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="px-4 py-2.5 rounded-xl border border-line bg-panel text-ink-2 text-base font-medium hover:text-ink hover:border-accent/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>

        {!answered ? (
          <span className="text-sm text-ink-3">Choose an answer to continue</span>
        ) : (
          <button
            onClick={() => goTo(index + 1)}
            disabled={index === cards.length - 1}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black text-base font-bold hover:from-amber-400 hover:to-orange-500 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {index === cards.length - 1 ? 'Finish' : 'Next →'}
          </button>
        )}
      </div>
    </div>
  )
}
