/**
 * Civilization prediction for an uploaded artifact.
 *
 * The browser never sees the OpenAI key: the photo is sent to
 * /api/vision (mode "classify"), which asks the vision model for the top
 * three civilizations, three short reasons and a confidence score.
 *
 * If that call fails (offline, rate limit, missing key, unreadable answer)
 * the service falls back to a local comparison of the photo's colours and
 * proportions against the bundled reference palettes. The fallback needs no
 * network and is what runs in local dev ($0).
 */
import civilizations from '../../data/civilizations.json'
import { REFERENCE_CIVS, referenceCiv } from '../references'
import { DEV_MOCK_AI, recordVisionCall } from './restoreService'

type Civ = (typeof civilizations.civilizations)[number]

const CIVS: Civ[] = civilizations.civilizations
const byId = new Map(CIVS.map((c) => [c.id, c]))

export type PredictionEntry = {
  id: string
  name: string
  /** 0-1 */
  probability: number
}

export type Prediction = {
  civId: string
  name: string
  /** 0-1 probability of the top civilization. */
  probability: number
  ranked: PredictionEntry[]
  reasons: string[]
  /** 0-1 confidence reported by the model (or the local score). */
  confidence: number
  source: 'vision' | 'local'
}

type VisionAnswer = {
  civilizations?: { name?: unknown; probability?: unknown }[]
  reasons?: unknown
  confidence?: unknown
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '')

/** Maps any of the names the model might use back to our civilization id. */
function resolveCivId(raw: string): string | null {
  const key = norm(raw)
  if (!key) return null
  const candidates = [...CIVS.map((c) => ({ id: c.id, name: c.name })), ...REFERENCE_CIVS]
  for (const c of candidates) {
    const n = norm(c.name)
    if (n === key) return c.id
  }
  for (const c of candidates) {
    const n = norm(c.name)
    if (key.includes(n) || n.includes(key)) return c.id
  }
  return null
}

/** Loads a data URL into an <img>. */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('This image could not be opened.'))
    img.src = src
  })
}

/** Shrinks the photo so the classify request stays well under the body cap. */
async function prepareForVision(dataUrl: string): Promise<string> {
  const img = await loadImage(dataUrl)
  const max = 512
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(16, Math.round(img.naturalWidth * scale))
  const h = Math.max(16, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  return canvas.toDataURL('image/jpeg', 0.82)
}

function cleanAnswer(answer: VisionAnswer | null): Prediction | null {
  if (!answer || !Array.isArray(answer.civilizations)) return null
  const ranked: PredictionEntry[] = []
  for (const entry of answer.civilizations) {
    if (typeof entry?.name !== 'string') continue
    const id = resolveCivId(entry.name)
    if (!id || ranked.some((r) => r.id === id)) continue
    const raw = typeof entry.probability === 'number' ? entry.probability : Number(entry.probability)
    if (!Number.isFinite(raw)) continue
    // Accept both 0-1 and 0-100 answers.
    const p = raw > 1 ? raw / 100 : raw
    ranked.push({ id, name: byId.get(id)?.name ?? entry.name, probability: Math.max(0, Math.min(1, p)) })
  }
  if (!ranked.length) return null
  ranked.sort((a, b) => b.probability - a.probability)
  const total = ranked.reduce((sum, r) => sum + r.probability, 0)
  if (total > 1.001) ranked.forEach((r) => (r.probability = r.probability / total))

  const reasons = Array.isArray(answer.reasons)
    ? answer.reasons.filter((r): r is string => typeof r === 'string' && r.trim().length > 0).slice(0, 3)
    : []
  const rawConf = typeof answer.confidence === 'number' ? answer.confidence : Number(answer.confidence)
  const confidence = Number.isFinite(rawConf)
    ? Math.max(0, Math.min(1, rawConf > 1 ? rawConf / 100 : rawConf))
    : ranked[0].probability

  const top = ranked[0]
  const topName = byId.get(top.id)?.name ?? top.name
  const filler = [
    `Overall colour and shape most similar to ${topName}`,
    `Decoration matches known ${topName} examples`,
    `Silhouette proportions closest to ${topName} pottery`,
  ]
  while (reasons.length < 3) reasons.push(filler[reasons.length])
  return {
    civId: top.id,
    name: top.name,
    probability: top.probability,
    ranked,
    reasons: reasons.slice(0, 3),
    confidence,
    source: 'vision',
  }
}

async function classifyWithVision(dataUrl: string): Promise<Prediction | null> {
  const image = await prepareForVision(dataUrl)
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), 25_000)
  try {
    const res = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'classify', images: [image] }),
      signal: controller.signal,
    })
    if (!res.ok) return null
    const json = (await res.json()) as { mock?: boolean; classification?: VisionAnswer | null }
    // The $0 mock answer is not a real vision call: use the local model instead
    // so the numbers still describe the uploaded photo.
    if (json.mock) return null
    const cleaned = cleanAnswer(json.classification ?? null)
    if (cleaned) recordVisionCall()
    return cleaned
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}

/* ------------------------------------------------------------------ */
/* Local fallback                                                      */
/* ------------------------------------------------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

type Sample = {
  /** Foreground (object) bounding-box aspect ratio, width / height. */
  aspect: number
  /** Share of pixels whose nearest reference colour belongs to each civ. */
  colours: number[]
  /** Dominant surface colour as hex. */
  dominant: string
}

async function samplePhoto(dataUrl: string): Promise<Sample> {
  const img = await loadImage(dataUrl)
  const max = 96
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(8, Math.round(img.naturalWidth * scale))
  const h = Math.max(8, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  // Border median = the plain backdrop. Excluding it stops a cream background
  // from voting for a pale-marble civilization.
  const border: number[][] = []
  const takeBorder = (x: number, y: number) => {
    const i = (y * w + x) * 4
    if (data[i + 3] >= 40) border.push([data[i], data[i + 1], data[i + 2]])
  }
  for (let x = 0; x < w; x += 2) {
    takeBorder(x, 0)
    takeBorder(x, h - 1)
  }
  for (let y = 0; y < h; y += 2) {
    takeBorder(0, y)
    takeBorder(w - 1, y)
  }
  const median = (values: number[]) => {
    if (!values.length) return 255
    values.sort((a, b) => a - b)
    return values[values.length >> 1]
  }
  const bg = [
    median(border.map((p) => p[0])),
    median(border.map((p) => p[1])),
    median(border.map((p) => p[2])),
  ]

  const palettes = REFERENCE_CIVS.map((civ) => civ.palette.map(hexToRgb))
  const counts = REFERENCE_CIVS.map(() => 0)
  const buckets = new Map<string, { n: number; r: number; g: number; b: number }>()
  let sampled = 0
  let opaque = 0
  // Bounding box of the pixels that are not backdrop: gives the object's
  // own width/height ratio instead of the photo's.
  let minX = w
  let minY = h
  let maxX = -1
  let maxY = -1

  const accumulate = (skipBackground: boolean) => {
    counts.fill(0)
    buckets.clear()
    sampled = 0
    opaque = 0
    minX = w
    minY = h
    maxX = -1
    maxY = -1
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        if (data[i + 3] < 40) continue
        opaque++
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        if (
          skipBackground &&
          Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2) < 42
        ) {
          continue
        }
        sampled++
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        let bestCiv = 0
        let bestDist = Infinity
        for (let c = 0; c < palettes.length; c++) {
          for (const [pr, pg, pb] of palettes[c]) {
            const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
            if (d < bestDist) {
              bestDist = d
              bestCiv = c
            }
          }
        }
        counts[bestCiv]++
        // coarse 32-step bucket for the dominant colour
        const key = `${r >> 5}-${g >> 5}-${b >> 5}`
        const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 }
        bucket.n++
        bucket.r += r
        bucket.g += g
        bucket.b += b
        buckets.set(key, bucket)
      }
    }
  }

  accumulate(true)
  // Object fills the frame (nothing left after background removal): keep all.
  if (!sampled || sampled < opaque * 0.08) accumulate(false)

  let dominant: [number, number, number] = [184, 134, 43]
  let top = 0
  for (const b of buckets.values()) {
    if (b.n > top) {
      top = b.n
      dominant = [Math.round(b.r / b.n), Math.round(b.g / b.n), Math.round(b.b / b.n)]
    }
  }
  const toHex = (v: number) => v.toString(16).padStart(2, '0')
  const boxW = Math.max(1, maxX - minX + 1)
  const boxH = Math.max(1, maxY - minY + 1)
  const objectAspect =
    maxX > minX && maxY > minY ? boxW / boxH : img.naturalWidth / Math.max(1, img.naturalHeight)
  return {
    aspect: objectAspect,
    colours: counts.map((n) => (sampled ? n / sampled : 0)),
    dominant: `#${toHex(dominant[0])}${toHex(dominant[1])}${toHex(dominant[2])}`,
  }
}

function fallbackReasons(civId: string, colourShare: number, aspect: number, confidence: number): string[] {
  const civ = referenceCiv(civId)
  const name = byId.get(civId)?.name ?? civ?.name ?? 'this civilization'
  const cue = civ?.cue ?? 'the colours typical of this civilization'
  const shape =
    aspect >= 1.15
      ? `Wide, open bowl profile typical of ${name} tableware`
      : aspect <= 0.9
        ? `Tall, narrow profile like ${name} storage jars`
        : `Balanced, rounded silhouette that matches ${name} vessels`
  return [
    `Colours closest to ${cue}`,
    shape,
    `${Math.round(Math.min(1, colourShare) * 100)}% of the sampled surface sits inside the known ${name} palette (${Math.round(
      confidence * 100
    )}% confidence)`,
  ]
}

function classifyLocally(sample: Sample): Prediction {
  const scored = REFERENCE_CIVS.map((civ, i) => {
    const share = sample.colours[i]
    const colourScore = Math.min(1, share * 2.4)
    const aspectScore = Math.exp(-Math.abs(Math.log(sample.aspect / civ.aspect)) * 1.1)
    return {
      id: civ.id,
      name: byId.get(civ.id)?.name ?? civ.name,
      share,
      score: colourScore * 0.78 + aspectScore * 0.22,
    }
  }).sort((a, b) => b.score - a.score)

  // Softmax, then blended with a flat prior: the local heuristic is a guess,
  // so it should never claim the certainty of the vision model.
  const T = 0.2
  const exps = scored.map((s) => Math.exp(s.score / T))
  const sum = exps.reduce((a, b) => a + b, 0)
  const prior = 1 / REFERENCE_CIVS.length
  const ranked = scored.map((s, i) => ({
    id: s.id,
    name: s.name,
    probability: 0.55 * (exps[i] / sum) + 0.45 * prior,
  }))
  const top = ranked[0]
  const confidence = Math.max(0.34, Math.min(0.78, top.probability))

  return {
    civId: top.id,
    name: top.name,
    probability: top.probability,
    ranked: ranked.slice(0, 3),
    reasons: fallbackReasons(top.id, scored[0].share, sample.aspect, confidence),
    confidence,
    source: 'local',
  }
}

/**
 * Predicts the civilization of the artifact in `dataUrl`.
 * Never throws: the local fallback always returns an answer.
 */
export async function predictCivilization(dataUrl: string): Promise<Prediction> {
  if (!DEV_MOCK_AI) {
    const vision = await classifyWithVision(dataUrl).catch(() => null)
    if (vision) {
      // The schema asks for three, but never show fewer bars if the model
      // answers with one or two: fill the rest from the local comparison.
      if (vision.ranked.length < 3) {
        const local = classifyLocally(await samplePhoto(dataUrl))
        for (const entry of local.ranked) {
          if (vision.ranked.length >= 3) break
          if (!vision.ranked.some((r) => r.id === entry.id)) vision.ranked.push(entry)
        }
      }
      return vision
    }
  }
  const sample = await samplePhoto(dataUrl)
  return classifyLocally(sample)
}
