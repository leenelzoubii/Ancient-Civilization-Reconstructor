import { useCallback, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import civilizations from '../../data/civilizations.json'
import { CIV_ILLUSTRATIONS } from '../illustrations'
import type { ArtifactAnalysis } from '../services/analysis'
import type { Prediction } from '../services/predictService'
import type { RestoreResult } from '../services/restoreService'
import { referenceImages } from '../references'

type Civ = (typeof civilizations.civilizations)[number]

const CIVS: Civ[] = civilizations.civilizations

const CIV_ACCENTS: Record<string, string> = {
  egypt: '#b8862b',
  rome: '#a4502f',
  maya: '#2f6b55',
  'taj-mahal': '#d9a92e',
  khorfakkan: '#23466b',
  petra: '#a4502f',
  'al-jazirat-al-hamra': '#2f6b55',
  'dhayah-fort': '#b8862b',
}

type Tab = 'side' | 'compare' | 'restored'

export type ReconstructionResultProps = {
  originalUrl: string
  restoredUrl: string | null
  result: RestoreResult
  prediction: Prediction | null
  analysis: ArtifactAnalysis | null
  /** Wall-clock duration of the whole pipeline, in milliseconds. */
  elapsedMs: number
  mode: 'manual' | 'auto'
  /** True when the page is showing a saved attempt instead of a fresh run. */
  fromHistory?: boolean
  onBack: () => void
  onReset: () => void
  onTryAgain: () => void
  onDownload: () => void
}

export default function ReconstructionResult({
  originalUrl,
  restoredUrl,
  result,
  prediction,
  analysis,
  elapsedMs,
  mode,
  fromHistory = false,
  onBack,
  onReset,
  onTryAgain,
  onDownload,
}: ReconstructionResultProps) {
  const [tab, setTab] = useState<Tab>('side')

  const predictedCiv = prediction ? CIVS.find((c) => c.id === prediction.civId) ?? null : null

  return (
    <div className="container result-page">
      <div className="page-head" style={{ paddingBottom: 10 }}>
        <a
          className="back"
          href="#/reconstruct"
          onClick={(e) => {
            e.preventDefault()
            onBack()
          }}
        >
          ← Back to the restorer
        </a>
        <span className="eyebrow">{fromHistory ? 'Saved repair' : 'AI Artifact Repair'}</span>
        <h1>{fromHistory ? 'Saved Repair' : 'Repair Result'}</h1>
      </div>

      <ol className="stepper">
        <li className="done">
          <span className="num">✓</span>Upload photo
        </li>
        <li className="done">
          <span className="num">✓</span>Repair damage
        </li>
        <li className="active">
          <span className="num">3</span>Repaired result
        </li>
      </ol>

      {prediction && predictedCiv ? (
        <PredictionCard prediction={prediction} civ={predictedCiv} />
      ) : null}

      <div className="recon-layout">
        <div>
          <div className="tabs" role="tablist" aria-label="Result views">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'side'}
              onClick={() => setTab('side')}
            >
              Side by side
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'compare'}
              onClick={() => setTab('compare')}
            >
              Compare slider
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'restored'}
              onClick={() => setTab('restored')}
            >
              Repaired areas
            </button>
          </div>

          {tab === 'side' && (
            <div className="result-grid">
              <div className="result-card">
                <h3>Your uploaded photo</h3>
                <div className="img-box">
                  <img src={originalUrl} alt="Your uploaded artifact" />
                </div>
              </div>
              <div className="result-arrow" aria-hidden="true">
                <svg viewBox="0 0 48 48">
                  <path d="M8 24h30M28 14l10 10-10 10" />
                </svg>
              </div>
              <div className="result-card">
                <h3>Repaired photo</h3>
                <div className="img-box">
                  {restoredUrl ? (
                    <img src={restoredUrl} alt="Your photo with only the damage repaired" />
                  ) : (
                    <div style={{ padding: 18, textAlign: 'center' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>No repaired image was returned.</p>
                      <p className="muted" style={{ margin: '6px 0 0', fontSize: '.86rem' }}>
                        {result.error ??
                          'The repair service did not send an image. Try again or use the manual brush.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'compare' && (
            <div className="result-card">
              <CompareSlider before={originalUrl} after={restoredUrl} />
              <p className="muted" style={{ margin: '10px 0 0', fontSize: '.88rem' }}>
                Drag the handle to compare your photo with the repaired version.
              </p>
            </div>
          )}

          {tab === 'restored' && (
            <div className="result-card">
              <h3>Repaired areas</h3>
              <div className="img-box">
                {analysis?.overlayUrl || restoredUrl ? (
                  <img
                    src={analysis?.overlayUrl ?? (restoredUrl as string)}
                    alt="Repaired photo with the rebuilt pixels highlighted"
                  />
                ) : (
                  <p className="muted" style={{ margin: 0 }}>
                    The highlighted version is not available for this result.
                  </p>
                )}
              </div>
              {analysis ? (
                <div className="legend" style={{ textAlign: 'left' }}>
                  <span>
                    <i style={{ background: '#d65c42' }} />
                    Repaired area ({analysis.restoredPct.toFixed(1)}%)
                  </span>
                </div>
              ) : null}
              <p className="muted" style={{ margin: '10px 0 0', fontSize: '.86rem' }}>
                Only these pixels were rebuilt. Every other pixel is your original photo.
              </p>
            </div>
          )}

          <div className="about-note">
            <strong>About this repair.</strong>{' '}
            {mode === 'auto'
              ? 'The local detector marked thin cracks, chips and small imperfections'
              : 'You painted the damaged areas'}{' '}
            and the AI filled only those pixels. Every other pixel — the object, its shape, colours,
            lighting, background and crop — comes directly from your uploaded photo. The AI does not
            generate, restyle, redraw or replace the artifact. No reference images are used: the only
            inputs are your photo and the damage mask. Results are estimates for educational purposes
            and should be checked by an expert before being used in research.
            {result.note ? ` ${result.note}` : ''}
          </div>

          <div className="result-actions">
            <button type="button" className="btn btn-outline" onClick={onReset}>
              Repair another artifact
            </button>
            {!fromHistory && (result.failed || result.weak || result.engine === 'local') && (
              <button type="button" className="btn btn-outline" onClick={onTryAgain}>
                Try again
              </button>
            )}
            {restoredUrl && !result.failed ? (
              <button type="button" className="btn btn-primary" onClick={onDownload}>
                <svg viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M7 10l5 5 5-5" />
                  <path d="M12 15V3" />
                </svg>
                Download result
              </button>
            ) : null}
          </div>
        </div>

        <aside>
          {analysis ? (
            <section className="panel">
              <h3>Repair analysis</h3>
              <AnalysisBody
                analysis={analysis}
                confidence={prediction?.confidence ?? null}
                elapsedMs={elapsedMs}
              />
              <p className="analysis-note">
                Only your photo and the damage mask were sent to the image model. No reference images
                were used.
              </p>
            </section>
          ) : (
            <section className="panel">
              <h3>Repair analysis</h3>
              <p className="muted" style={{ margin: 0, fontSize: '.9rem' }}>
                The analysis could not be computed for this photo. The repaired image itself is still
                available.
              </p>
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Predicted civilization card                                         */
/* ------------------------------------------------------------------ */

function PredictionCard({ prediction, civ }: { prediction: Prediction; civ: Civ }) {
  const art = CIV_ILLUSTRATIONS[civ.id]
  const pct = Math.round(prediction.probability * 100)
  const accent = CIV_ACCENTS[civ.id] ?? '#b8862b'
  const refs = referenceImages(civ.id)
  const ranked = prediction.ranked.length
    ? prediction.ranked
    : [{ id: civ.id, name: civ.name, probability: prediction.probability }]

  return (
    <section className="prediction" style={{ '--accent': accent } as CSSProperties}>
      <div className="pred-art" dangerouslySetInnerHTML={{ __html: art ? art('pr') : '' }} />
      <div className="pred-body">
        <span className="eyebrow">Optional context</span>
        <h2>
          Looks like {civ.name} <span className="pred-pct">{pct}% match</span>
        </h2>
        <p className="muted" style={{ margin: '0 0 14px' }}>
          {civ.era} · {civ.region}
        </p>
        <p className="pred-note">
          This is a separate colour-and-shape comparison from your photo. It is not sent to the image
          model and does not change the repair.
        </p>
        <div className="pred-bars">
          {ranked.map((entry, i) => {
            const width = Math.max(2, Math.round(entry.probability * 100))
            return (
              <div key={entry.id} className={`pred-row${i === 0 ? ' top' : ''}`}>
                <span>{entry.name}</span>
                <div className="bar">
                  <div
                    style={{
                      width: `${width}%`,
                      background: i === 0 ? '#2f6b55' : '#a4502f',
                    }}
                  />
                </div>
                <strong>{width}%</strong>
              </div>
            )
          })}
        </div>
      </div>
      <div className="pred-why">
        <h3>Why it looks similar</h3>
        <ul className="checklist">
          {prediction.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      </div>
      {refs.length ? (
        <details className="ref-details">
          <summary>
            <span>Reference artifacts used for this match</span>
            <span className="ref-count">{refs.length} images</span>
          </summary>
          <p className="ref-note">
            These clean reference artifacts are only used for the colour-and-shape comparison.
            They are never sent to the repair model.
          </p>
          <div className="ref-strip">
            {refs.map((src, i) => (
              <figure key={src}>
                <img
                  src={src}
                  alt={`${civ.name} reference artifact ${i + 1}`}
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Analysis body                                                       */
/* ------------------------------------------------------------------ */

function AnalysisBody({
  analysis,
  confidence,
  elapsedMs,
}: {
  analysis: ArtifactAnalysis
  confidence: number | null
  elapsedMs: number
}) {
  const clamped = confidence === null ? null : Math.max(0, Math.min(1, confidence))
  const level = clamped === null ? null : clamped >= 0.72 ? 'high' : clamped >= 0.5 ? 'medium' : 'low'
  const tone = level === 'high' ? '#1d5a40' : level === 'medium' ? '#7a5410' : '#8a2a1e'

  return (
    <>
      <div className="stat-grid">
        <div className="stat">
          <strong>{analysis.restoredPct.toFixed(1)}%</strong>
          <span>of the object repaired</span>
        </div>
        <div className="stat">
          <strong>{Math.round(analysis.objectPct)}%</strong>
          <span>object in frame</span>
        </div>
        <div className="stat">
          <strong>{(elapsedMs / 1000).toFixed(1)}s</strong>
          <span>processing time</span>
        </div>
        <div className="stat">
          <strong>1</strong>
          <span>photo used — no references</span>
        </div>
      </div>

      {clamped !== null && level ? (
        <div className="confidence-block">
          <div className="confidence">
            <span className={`pill ${level}`}>
              {level[0].toUpperCase() + level.slice(1)} confidence
            </span>
            <div className="bar">
              <div style={{ width: `${Math.round(clamped * 100)}%`, background: tone }} />
            </div>
            <strong>{Math.round(clamped * 100)}%</strong>
          </div>
          <p className="confidence-note">
            Confidence in the civilization match above ({Math.round(clamped * 100)}%). It is a
            separate score from the repair and does not describe how good the repaired pixels look.
          </p>
        </div>
      ) : (
        <p className="confidence-note muted">
          No civilization match was run for this repair, so there is no match confidence to show.
        </p>
      )}

      <details className="analysis-how">
        <summary>How is confidence calculated?</summary>
        <div className="analysis-how-body">
          <p>
            <strong>With the vision model:</strong> the uploaded photo is compared with known
            examples of each civilization. The model returns its top three guesses, a short reason
            for each, and one confidence score for its best answer. That score is shown here,
            clamped to 0–100%.
          </p>
          <p>
            <strong>With the local fallback:</strong> if the vision model is unavailable, the photo
            is sampled in the browser. 78% of the score is the share of the object's colours that
            fall inside a civilization's reference palette, and 22% is how closely the object's
            width-to-height ratio matches that civilization's typical vessels. The result is
            deliberately capped at 78% so the fallback never claims the certainty of the vision
            model.
          </p>
          <p>
            Either way the score is only about the civilization guess. It never measures how good
            the repaired pixels look.
          </p>
        </div>
      </details>

      <div className="legend">
        <span>
          <i style={{ background: '#d65c42' }} />
          Repaired area ({analysis.restoredPct.toFixed(1)}%)
        </span>
      </div>

      <div className="field" style={{ marginBottom: 0 }}>
        <label>Colour palette</label>
        <div className="swatches">
          {analysis.palette.map((colour) => (
            <span key={colour} title={colour} style={{ background: colour }} />
          ))}
        </div>
        <span className="hint">Sampled from {analysis.paletteSource}.</span>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ */
/* Compare slider                                                      */
/* ------------------------------------------------------------------ */

function CompareSlider({ before, after }: { before: string; after: string | null }) {
  const [pos, setPos] = useState(0.5)
  const [dragging, setDragging] = useState(false)
  // The stage takes the uploaded photo's own aspect ratio. Both images then
  // fill that one box, so the split line always sits on the same pixels.
  const [ratio, setRatio] = useState(4 / 3)
  const ref = useRef<HTMLDivElement>(null)

  const move = useCallback((clientX: number) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (!rect.width) return
    setPos(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)))
  }, [])

  return (
    <div
      className="compare"
      ref={ref}
      style={
        {
          aspectRatio: String(ratio),
          maxWidth: `calc(520px * ${ratio})`,
        } as CSSProperties
      }
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragging(true)
        move(e.clientX)
      }}
      onPointerMove={(e) => {
        if (dragging) move(e.clientX)
      }}
      onPointerUp={() => setDragging(false)}
      onPointerCancel={() => setDragging(false)}
    >
      <img
        className="compare-before"
        src={before}
        alt="Your uploaded artifact"
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget
          if (img.naturalWidth && img.naturalHeight) {
            setRatio(img.naturalWidth / img.naturalHeight)
          }
        }}
      />
      {after ? (
        <div className="after" style={{ clipPath: `inset(0 0 0 ${pos * 100}%)` }}>
          <img src={after} alt="Your photo with the damage repaired" draggable={false} />
        </div>
      ) : null}
      <span className="lbl" style={{ left: 10 }}>
        Before
      </span>
      <span className="lbl" style={{ right: 10 }}>
        After
      </span>
      <div
        className="handle"
        style={{ left: `calc(${pos * 100}% - 1.5px)` }}
        role="slider"
        tabIndex={0}
        aria-label="Comparison position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pos * 100)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 0.05))
          if (e.key === 'ArrowRight') setPos((p) => Math.min(1, p + 0.05))
        }}
      />
    </div>
  )
}
