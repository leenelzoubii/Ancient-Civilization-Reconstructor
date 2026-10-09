// Artifact restoration client service.
// Talks to the Vercel Functions in /api so the OpenAI key never reaches
// the browser. Gemini and Pollinations were removed.
//
// SPEND RULES (a single click maps to at most ONE billable image call):
// - DEV_MOCK_AI (default true in dev): no network call at all, $0.
// - Exactly one image edit per restoreWithMask call, never an auto-retry.
//   A retry happens only when the user clicks "Try again".
// - An HTTP 200 AI result is ALWAYS shown, even if verification says weak.
//   Diff/judge only change the badge/note, never replace or hide the image.
// - Local fill runs ONLY when the AI call itself failed AND the painted area
//   is under 5% — never over a paid AI result.
// - Vision judge is opt-in (VITE_VISION_LAYER=true) and only annotates.
//
// Approximate cost (Oct 2026 docs, 1024px, rounded up incl. inputs):
// - image edit low ~$0.02, medium ~$0.03, high ~$0.06
//   (gpt-image-2.5-sunburst: $30/M image output, $8/M image input;
//   calculator output-only: low $0.0059, medium $0.0132, high $0.0527)
// - gpt-6-luna judge call ~$0.001 (well under a cent)
// Worst case per restore = 1 image edit (+ 1 judge call if opted in).

// $0 testing switch. True in dev builds by default (override with
// VITE_MOCK_AI=false to hit the real HTTP stack against the mock server).
export const DEV_MOCK_AI =
  import.meta.env.VITE_MOCK_AI != null
    ? import.meta.env.VITE_MOCK_AI === 'true'
    : import.meta.env.DEV

// Vision judge is opt-in: it costs a (tiny) extra call and must never
// trigger another image edit — when enabled it only annotates the result.
const USE_VISION_LAYER = import.meta.env.VITE_VISION_LAYER === 'true'

// Spend caps and thresholds.
const MAX_PAID_IMAGE_CALLS_PER_RESTORE = 1
const MIN_MASK_FRACTION = 0.001 // 0.1%: below this, no paid call is made
export const LARGE_MASK_FRACTION = 0.15 // 15%: warn + require explicit ack
const LOCAL_FALLBACK_MAX_FRACTION = 0.05 // 5%: local fill only below this
const MAX_IMAGE_BYTES = 4_000_000

// Conservative per-call estimates in USD (see cost comment above).
const COST_PER_EDIT_USD: Record<string, number> = {
  low: 0.02,
  medium: 0.03,
  high: 0.06,
}
const COST_PER_VISION_USD = 0.001
// Server default quality in production (api/_lib IMAGE_QUALITY). Used only
// for the pre-call "about $X" label; the real value comes back in the
// x-image-quality response header and is used for session accounting.
const ASSUMED_PROD_QUALITY = 'medium'

export function estimatedEditCostLabel(): string {
  if (DEV_MOCK_AI) return '$0.00 (mock mode — no OpenAI call)'
  const cost = COST_PER_EDIT_USD[ASSUMED_PROD_QUALITY] ?? 0.03
  return `about $${cost.toFixed(2)} (medium quality)`
}

function costForQuality(quality: string | null): number {
  if (!quality || quality === 'mock') return 0
  return COST_PER_EDIT_USD[quality] ?? 0.03
}

// Running session totals (page lifetime). Displayed on the Restore page.
let sessionImageCalls = 0
let sessionVisionCalls = 0
let sessionSpendUsd = 0

export function getSessionSpend(): {
  imageCalls: number
  visionCalls: number
  estimatedUsd: number
} {
  return {
    imageCalls: sessionImageCalls,
    visionCalls: sessionVisionCalls,
    estimatedUsd: sessionSpendUsd,
  }
}

export function resetSessionSpend(): void {
  sessionImageCalls = 0
  sessionVisionCalls = 0
  sessionSpendUsd = 0
}

const DIFF_THRESHOLD = 10 // mean abs diff over 0-255 scale
const MASK_DILATE_PX = 6
const MASK_FEATHER_PX = 3
const JUDGE_MAX_SIDE = 768

const EDIT_PROMPT_MASK =
  'This is a photo of an ancient terracotta/stone artifact with thin ' +
  'cracks. Fill ONLY the transparent masked areas, which follow the ' +
  'cracks, so the surface looks continuous and undamaged. Match the ' +
  'surrounding clay/stone color, grain, texture and lighting exactly. ' +
  'Keep the carved features, shape, colors and background identical. Do ' +
  'not smooth, blur, flatten or paint over details. Do not add anything new.'

export type JudgeResult = {
  repaired: boolean | null
  unchanged_elsewhere: boolean | null
  remaining_damage: string
}

export type RestoreResult = {
  blob: Blob | null
  engine: 'ai' | 'local'
  failed: boolean
  /** AI returned 200 but verification suggests a weak result (still shown). */
  weak: boolean
  diff: number | null
  judge: JudgeResult | null
  /** Weak-result note shown alongside the image (never replaces it). */
  note?: string
  /** Real failure reason (API error text or verification message). */
  error?: string
  /** Why a local repair was applied instead of the AI edit. */
  fallbackReason?: string
  /** True when the result came from the $0 mock path, not OpenAI. */
  mock?: boolean
  /** Billable image calls made by this restore (0 in mock mode). */
  paidImageCalls?: number
}

export type MaskAnalysis = {
  width: number
  height: number
  /** Fraction of the DILATED (actually sent) mask at >=128/255. */
  fraction: number
  large: boolean
}

export type MaskPreflight = {
  analysis: MaskAnalysis
  painted: Coverage
  dilated: Coverage
  feathered: Coverage
}

type Coverage = { data: Uint8Array; width: number; height: number }

function logRestore(info: Record<string, unknown>) {
  if (import.meta.env.DEV) console.debug('[restore]', info)
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

export async function restoreWithMask(
  imageBase64: string,
  maskSource: string
): Promise<RestoreResult> {
  const originalUrl = `data:image/png;base64,${imageBase64}`

  // Pre-flight: image size (free, local). Never pay for a doomed request.
  if (base64ByteLength(imageBase64) > MAX_IMAGE_BYTES) {
    return {
      blob: null,
      engine: 'ai',
      failed: true,
      weak: false,
      diff: null,
      judge: null,
      error: `Image is larger than ${
        MAX_IMAGE_BYTES / 1_000_000
      }MB. Use a smaller photo.`,
      paidImageCalls: 0,
    }
  }

  const img = await loadImage(originalUrl)
  if (!img.naturalWidth || !img.naturalHeight) {
    throw new Error('Could not read the image. Try another photo.')
  }

  // Pre-flight: mask presence, PNG/alpha format, dims, coverage (free).
  let pre: MaskPreflight
  try {
    pre = await preflightMask(imageBase64, maskSource)
  } catch (err) {
    return {
      blob: null,
      engine: 'ai',
      failed: true,
      weak: false,
      diff: null,
      judge: null,
      error: err instanceof Error ? err.message : 'Mask check failed.',
      paidImageCalls: 0,
    }
  }
  const { analysis, dilated, feathered } = pre
  logRestore({
    preflight: {
      width: analysis.width,
      height: analysis.height,
      fraction: Number(analysis.fraction.toFixed(4)),
      large: analysis.large,
      mock: DEV_MOCK_AI,
    },
  })

  const openAiMask = await buildOpenAiMaskBlob(dilated)

  // $0 path first: local fill stands in for the AI edit so the full
  // blend → diff → judge → badge flow runs with zero OpenAI calls.
  if (DEV_MOCK_AI) {
    logRestore({
      mockEdit: true,
      note: 'local fill stands in for the AI edit; nothing billed',
    })
    const standIn = await fillMasked(imageBase64, dilated)
    const blended = await blendByCoverage(originalUrl, standIn, feathered)
    const diff = await computeDiff(originalUrl, blended, feathered)
    const judge = USE_VISION_LAYER ? mockJudge() : null
    return {
      blob: blended,
      engine: 'ai',
      failed: false,
      weak: false,
      diff,
      judge,
      mock: true,
      paidImageCalls: 0,
    }
  }

  // Exactly ONE paid image call per restore. No automatic retry: a retry
  // happens only when the user clicks "Try again".
  let edited: Blob
  let quality: string | null
  try {
    const res = await callRestore(EDIT_PROMPT_MASK, imageBase64, openAiMask)
    edited = res.blob
    quality = res.quality
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logRestore({ aiFailed: true, error: message })
    // Local fill ONLY when the AI call itself failed AND the painted area
    // is small — never over a paid AI result.
    if (analysis.fraction < LOCAL_FALLBACK_MAX_FRACTION) {
      const filled = await fillMasked(imageBase64, dilated)
      const localBlob = await blendByCoverage(originalUrl, filled, feathered)
      const localDiff = await computeDiff(originalUrl, localBlob, feathered)
      logRestore({ fallback: 'local', diff: localDiff, reason: message })
      return {
        blob: localBlob,
        engine: 'local',
        failed: false,
        weak: false,
        diff: localDiff,
        judge: null,
        fallbackReason:
          `AI call failed, so a basic local repair was applied instead. ` +
          `Real error: ${message}`,
        paidImageCalls: 0,
      }
    }
    return {
      blob: null,
      engine: 'ai',
      failed: true,
      weak: false,
      diff: null,
      judge: null,
      error: message,
      paidImageCalls: 0,
    }
  }

  // HTTP 200 = billed. Record it — then ALWAYS show the image, even weak.
  const cost = costForQuality(quality)
  sessionImageCalls += 1
  sessionSpendUsd += cost
  logRestore({ billedImageCall: sessionImageCalls, quality, costUsd: cost })

  const blended = await blendByCoverage(originalUrl, edited, feathered)
  const diff = await computeDiff(originalUrl, blended, feathered)

  // Opt-in judge only annotates; it can never trigger another edit.
  let judge: JudgeResult | null = null
  if (USE_VISION_LAYER) {
    judge = await judgeImages(originalUrl, blended, dilated).catch(() => null)
    if (judge) {
      sessionVisionCalls += 1
      sessionSpendUsd += COST_PER_VISION_USD
    }
  }

  const weak = diff <= DIFF_THRESHOLD || judge?.repaired === false
  logRestore({
    shown: 'ai-200',
    diff,
    judge,
    weak,
    paidImageCalls: MAX_PAID_IMAGE_CALLS_PER_RESTORE,
  })
  return {
    blob: blended,
    engine: 'ai',
    failed: false,
    weak,
    diff,
    judge,
    note: weak ? weakNote(diff, judge) : undefined,
    paidImageCalls: MAX_PAID_IMAGE_CALLS_PER_RESTORE,
  }
}

// ---------------------------------------------------------------------------
// Pre-flight checks (all free and local — run BEFORE any paid call)
// ---------------------------------------------------------------------------

export async function preflightMask(
  imageBase64: string,
  maskSource: string
): Promise<MaskPreflight> {
  if (!maskSource.startsWith('data:image/png;base64,')) {
    throw new Error('Mask must be a PNG data URL. Repaint the damage and try again.')
  }
  const img = await loadImage(`data:image/png;base64,${imageBase64}`)
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height
  // Verify the PNG bytes directly: real signature, exact dims, alpha channel
  // (transparent = edit, opaque = keep). Catches corrupt/inverted masks.
  const header = parsePngHeader(
    base64ToBytes(maskSource.slice('data:image/png;base64,'.length))
  )
  if (!header) {
    throw new Error('Mask is not a valid PNG. Repaint the damage and try again.')
  }
  if (header.width !== width || header.height !== height) {
    throw new Error(
      `Mask dimensions (${header.width}x${header.height}) do not match the ` +
        `image (${width}x${height}). Start over and repaint.`
    )
  }
  if (header.colorType !== 4 && header.colorType !== 6) {
    throw new Error(
      'Mask PNG must have an alpha channel (transparent = edit, opaque = keep).'
    )
  }

  const painted = await loadCoverage(maskSource, width, height)
  const dilated = dilateCoverage(painted, MASK_DILATE_PX)
  const feathered = featherCoverage(dilated, MASK_FEATHER_PX)

  let covered = 0
  for (let p = 0; p < dilated.data.length; p++) {
    if (dilated.data[p] >= 128) covered++
  }
  const fraction = covered / dilated.data.length
  if (fraction <= MIN_MASK_FRACTION) {
    throw new Error(
      `Painted area too small (${(fraction * 100).toFixed(2)}% of the image, ` +
        `minimum 0.1%). Paint over the damage first — tiny marks are not ` +
        `worth a paid call.`
    )
  }

  return {
    analysis: {
      width,
      height,
      fraction,
      large: fraction > LARGE_MASK_FRACTION,
    },
    painted,
    dilated,
    feathered,
  }
}

function weakNote(diff: number, judge: JudgeResult | null): string {
  let note = 'The AI result may be weak, please inspect.'
  const remaining = judge?.remaining_damage?.trim()
  if (judge?.repaired === false && remaining) {
    note += ` Judge: ${remaining}`
  } else {
    note += ` (change ${diff.toFixed(1)}/255).`
  }
  return note
}

function mockJudge(): JudgeResult {
  logRestore({ mockJudge: true })
  return {
    repaired: true,
    unchanged_elsewhere: true,
    remaining_damage: 'none (mock)',
  }
}

function base64ByteLength(base64: string): number {
  const pad = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0
  return Math.floor((base64.length * 3) / 4) - pad
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// Same minimal PNG header check as the server (api/_lib readPngInfo).
function parsePngHeader(
  bytes: Uint8Array
): { width: number; height: number; colorType: number } | null {
  if (bytes.length < 33) return null
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < 8; i++) if (bytes[i] !== sig[i]) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint32(8) !== 13) return null
  if (view.getUint32(12) !== 0x49484452) return null // 'IHDR'
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  if (!width || !height) return null
  return { width, height, colorType: bytes[25] }
}

// ---------------------------------------------------------------------------
// OpenAI image edit via serverless function
// ---------------------------------------------------------------------------

async function callRestore(
  prompt: string,
  imageBase64: string,
  mask: Blob | null
): Promise<{ blob: Blob; quality: string | null }> {
  // Hard safety net: in mock mode this function must never run. The mock
  // branch in restoreWithMask returns before reaching here.
  if (DEV_MOCK_AI) {
    throw new Error('Blocked: mock mode is on (DEV_MOCK_AI). No paid call was made.')
  }
  const form = new FormData()
  form.append('prompt', prompt)
  form.append('image', base64ToBlob(imageBase64, 'image/png'), 'image.png')
  if (mask) form.append('mask', mask, 'mask.png')

  const res = await fetch('/api/restore', { method: 'POST', body: form })
  const quality = res.headers.get('x-image-quality')
  const text = await res.text()
  logRestore({ restoreStatus: res.status, quality })

  if (!res.ok) {
    throw new Error(extractError(text, res.status))
  }

  let data: { data?: { b64_json?: string }[] }
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`restore returned invalid JSON (${res.status})`)
  }
  const b64 = data.data?.[0]?.b64_json
  if (!b64) throw new Error('restore returned 200 without image data')
  return { blob: base64ToBlob(b64, 'image/png'), quality }
}

function extractError(text: string, status: number): string {
  try {
    const parsed = JSON.parse(text)
    const message = parsed?.error?.message || parsed?.detail
    if (message) return `restore failed (${status}): ${message}`
  } catch {
    // fall through to raw text
  }
  const raw = text.slice(0, 300).trim()
  return `restore failed (${status})${raw ? `: ${raw}` : ''}`
}

// ---------------------------------------------------------------------------
// Vision layer (describe / judge)
// ---------------------------------------------------------------------------

async function postJson(path: string, payload: unknown): Promise<any> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const text = await res.text()
  let data: any = null
  try {
    data = JSON.parse(text)
  } catch {
    // handled below
  }
  if (!res.ok) {
    const message = data?.error?.message || text.slice(0, 300) || `HTTP ${res.status}`
    throw new Error(message)
  }
  return data
}

async function judgeImages(
  beforeUrl: string,
  afterBlob: Blob,
  crop: Coverage | null
): Promise<JudgeResult | null> {
  // Mock short-circuit so no code path can spend on vision in mock mode.
  if (DEV_MOCK_AI) return mockJudge()

  const afterUrl = await blobToDataUrl(afterBlob)

  let beforeImage = beforeUrl
  let afterImage = afterUrl
  if (crop) {
    const bbox = bboxOfCoverage(crop)
    if (bbox) {
      beforeImage = await cropDataUrl(beforeUrl, bbox)
      afterImage = await cropDataUrl(afterUrl, bbox)
    }
  } else {
    beforeImage = await fitDataUrl(beforeUrl, JUDGE_MAX_SIDE)
    afterImage = await fitDataUrl(afterUrl, JUDGE_MAX_SIDE)
  }

  const data = await postJson('/api/vision', {
    mode: 'judge',
    images: [beforeImage, afterImage],
  })
  if (!data || !data.judge || typeof data.judge !== 'object') return null
  const j = data.judge
  return {
    repaired: typeof j.repaired === 'boolean' ? j.repaired : null,
    unchanged_elsewhere:
      typeof j.unchanged_elsewhere === 'boolean' ? j.unchanged_elsewhere : null,
    remaining_damage:
      typeof j.remaining_damage === 'string' ? j.remaining_damage : '',
  }
}

// ---------------------------------------------------------------------------
// Verification: pixel diff
// ---------------------------------------------------------------------------

async function computeDiff(
  beforeUrl: string,
  afterBlob: Blob,
  coverage: Coverage | null
): Promise<number> {
  const SIZE = 64
  const afterUrl = await blobToDataUrl(afterBlob)
  const before = await loadImage(beforeUrl)
  const after = await loadImage(afterUrl)

  const sample = (img: HTMLImageElement): ImageData => {
    const canvas = document.createElement('canvas')
    canvas.width = SIZE
    canvas.height = SIZE
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, SIZE, SIZE)
    return ctx.getImageData(0, 0, SIZE, SIZE)
  }

  const a = sample(before)
  const b = sample(after)

  let selection: Uint8Array | null = null
  if (coverage) {
    selection = downscaleCoverage(coverage, SIZE, SIZE)
    let any = false
    for (let i = 0; i < selection.length; i++) {
      if (selection[i] > 0) {
        any = true
        break
      }
    }
    if (!any) selection = null
  }

  let total = 0
  let count = 0
  for (let p = 0; p < SIZE * SIZE; p++) {
    if (selection && selection[p] === 0) continue
    const i = p * 4
    const dr = Math.abs(a.data[i] - b.data[i])
    const dg = Math.abs(a.data[i + 1] - b.data[i + 1])
    const db = Math.abs(a.data[i + 2] - b.data[i + 2])
    total += (dr + dg + db) / 3
    count += 1
  }
  if (count === 0) return 0
  return total / count
}

function downscaleCoverage(
  coverage: Coverage,
  outW: number,
  outH: number
): Uint8Array {
  const { data, width, height } = coverage
  const out = new Uint8Array(outW * outH)
  for (let y = 0; y < outH; y++) {
    const sy0 = Math.floor((y * height) / outH)
    const sy1 = Math.max(sy0 + 1, Math.floor(((y + 1) * height) / outH))
    for (let x = 0; x < outW; x++) {
      const sx0 = Math.floor((x * width) / outW)
      const sx1 = Math.max(sx0 + 1, Math.floor(((x + 1) * width) / outW))
      let max = 0
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const v = data[sy * width + sx]
          if (v > max) max = v
        }
      }
      out[y * outW + x] = max
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Mask processing
// ---------------------------------------------------------------------------

async function loadCoverage(
  maskSource: string,
  expectedW: number,
  expectedH: number
): Promise<Coverage> {
  const src = maskSource.startsWith('data:')
    ? maskSource
    : `data:image/png;base64,${maskSource}`
  const img = await loadImage(src)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  if (w !== expectedW || h !== expectedH) {
    throw new Error(
      `Mask dimensions (${w}x${h}) do not match the image (${expectedW}x${expectedH}).`
    )
  }
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  const pixels = ctx.getImageData(0, 0, w, h).data
  // The UI paints opaque white strokes on a transparent canvas, so the
  // alpha channel is the damage coverage (edges stay antialias-soft).
  const data = new Uint8Array(w * h)
  for (let p = 0; p < w * h; p++) data[p] = pixels[p * 4 + 3]
  return { data, width: w, height: h }
}

function dilateCoverage(coverage: Coverage, radius: number): Coverage {
  const { data, width: w, height: h } = coverage
  if (radius <= 0) return { data: data.slice(), width: w, height: h }
  const tmp = new Uint8Array(w * h)
  const out = new Uint8Array(w * h)
  for (let y = 0; y < h; y++) {
    const row = y * w
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - radius)
      const x1 = Math.min(w - 1, x + radius)
      let m = 0
      for (let i = x0; i <= x1; i++) {
        const v = data[row + i]
        if (v > m) m = v
      }
      tmp[row + x] = m
    }
  }
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const y0 = Math.max(0, y - radius)
      const y1 = Math.min(h - 1, y + radius)
      let m = 0
      for (let i = y0; i <= y1; i++) {
        const v = tmp[i * w + x]
        if (v > m) m = v
      }
      out[y * w + x] = m
    }
  }
  return { data: out, width: w, height: h }
}

function featherCoverage(coverage: Coverage, radius: number): Coverage {
  const { data, width: w, height: h } = coverage
  if (radius <= 0) return { data: data.slice(), width: w, height: h }
  const windowSize = radius * 2 + 1
  let src = Float32Array.from(data)
  let dst = new Float32Array(w * h)

  const pass = (input: Float32Array, output: Float32Array, horizontal: boolean) => {
    const outer = horizontal ? h : w
    const inner = horizontal ? w : h
    for (let o = 0; o < outer; o++) {
      let sum = 0
      for (let i = -radius; i <= radius; i++) {
        const idx = horizontal
          ? o * w + Math.min(w - 1, Math.max(0, i))
          : Math.min(h - 1, Math.max(0, i)) * w + o
        sum += input[idx]
      }
      for (let i = 0; i < inner; i++) {
        const outIdx = horizontal ? o * w + i : i * w + o
        output[outIdx] = sum / windowSize
        const addIdx = horizontal
          ? o * w + Math.min(w - 1, i + radius + 1)
          : Math.min(h - 1, i + radius + 1) * w + o
        const subIdx = horizontal
          ? o * w + Math.min(w - 1, Math.max(0, i - radius))
          : Math.min(h - 1, Math.max(0, i - radius)) * w + o
        sum += input[addIdx] - input[subIdx]
      }
    }
  }

  // Two blur iterations approximate a gaussian feather.
  pass(src, dst, true)
  pass(dst, src, false)
  pass(src, dst, true)
  pass(dst, src, false)

  const out = new Uint8Array(w * h)
  for (let i = 0; i < out.length; i++) {
    out[i] = Math.max(0, Math.min(255, Math.round(src[i])))
  }
  return { data: out, width: w, height: h }
}

async function buildOpenAiMaskBlob(coverage: Coverage): Promise<Blob> {
  const { data, width: w, height: h } = coverage
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const image = ctx.createImageData(w, h)
  for (let p = 0; p < w * h; p++) {
    const i = p * 4
    const painted = data[p] >= 128
    image.data[i] = 255
    image.data[i + 1] = 255
    image.data[i + 2] = 255
    // OpenAI mask convention: fully transparent (alpha 0) = region to edit.
    image.data[i + 3] = painted ? 0 : 255
  }
  ctx.putImageData(image, 0, 0)
  return canvasToBlob(canvas)
}

function bboxOfCoverage(coverage: Coverage): {
  x: number
  y: number
  width: number
  height: number
} | null {
  const { data, width: w, height: h } = coverage
  let minX = w - 1
  let minY = h - 1
  let maxX = 0
  let maxY = 0
  let found = false
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[y * w + x] >= 128) {
        found = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (!found) return null
  const pad = 16
  minX = Math.max(0, minX - pad)
  minY = Math.max(0, minY - pad)
  maxX = Math.min(w - 1, maxX + pad)
  maxY = Math.min(h - 1, maxY + pad)
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

// ---------------------------------------------------------------------------
// Compositing and image helpers
// ---------------------------------------------------------------------------

async function blendByCoverage(
  beforeUrl: string,
  afterBlob: Blob,
  feathered: Coverage
): Promise<Blob> {
  const { data: cov, width: w, height: h } = feathered
  const before = await loadImage(beforeUrl)
  const after = await loadImage(await blobToDataUrl(afterBlob))

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(before, 0, 0, w, h)
  const beforeData = ctx.getImageData(0, 0, w, h)
  ctx.clearRect(0, 0, w, h)
  ctx.drawImage(after, 0, 0, w, h)
  const afterData = ctx.getImageData(0, 0, w, h)

  const out = ctx.createImageData(w, h)
  for (let p = 0; p < w * h; p++) {
    const i = p * 4
    const a = cov[p] / 255
    for (let c = 0; c < 3; c++) {
      out.data[i + c] = Math.round(
        beforeData.data[i + c] * (1 - a) + afterData.data[i + c] * a
      )
    }
    out.data[i + 3] = 255
  }
  ctx.putImageData(out, 0, 0)
  return canvasToBlob(canvas)
}

async function cropDataUrl(
  sourceUrl: string,
  bbox: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const img = await loadImage(sourceUrl)
  const scale = Math.min(
    1,
    JUDGE_MAX_SIDE / Math.max(bbox.width, bbox.height)
  )
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bbox.width * scale))
  canvas.height = Math.max(1, Math.round(bbox.height * scale))
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(
    img,
    bbox.x,
    bbox.y,
    bbox.width,
    bbox.height,
    0,
    0,
    canvas.width,
    canvas.height
  )
  return canvas.toDataURL('image/png')
}

async function fitDataUrl(sourceUrl: string, maxSide: number): Promise<string> {
  const img = await loadImage(sourceUrl)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  if (Math.max(w, h) <= maxSide) return sourceUrl
  const scale = maxSide / Math.max(w, h)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * scale)
  canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------------
// Local diffusion inpaint (Manual Mask fallback only)
// ---------------------------------------------------------------------------

// Local fill used ONLY as a $0 stand-in for the mock path and as a last
// resort when the AI call itself failed on a small painted area. Returns the
// full canvas with the masked region filled; the caller composites it with
// the feathered coverage.
async function fillMasked(
  imageBase64: string,
  hardCoverage: Coverage
): Promise<Blob> {
  const img = await loadImage(`data:image/png;base64,${imageBase64}`)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)

  seedFromNearest(imageData.data, w, h, hardCoverage.data)
  diffuseMasked(imageData.data, w, h, hardCoverage.data)

  ctx.putImageData(imageData, 0, 0)
  return canvasToBlob(canvas)
}

// Fill every masked pixel with the NEAREST unmasked pixel's color
// (multi-source BFS), so the fill carries real nearby texture — clay grain,
// carved edges, background noise — instead of a single flat mean color.
// Unmasked pixels are untouched. Copies are exact, so transitive copies
// still equal the nearest original source pixel.
function seedFromNearest(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  coverage: Uint8Array
) {
  const THRESH = 100
  const dist = new Int32Array(w * h).fill(-1)
  const qx = new Int32Array(w * h)
  const qy = new Int32Array(w * h)
  let head = 0
  let tail = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x
      if (coverage[p] < THRESH) {
        dist[p] = 0
        qx[tail] = x
        qy[tail] = y
        tail++
      }
    }
  }
  if (tail === 0) return // fully masked: nothing to sample from

  while (head < tail) {
    const x = qx[head]
    const y = qy[head]
    head++
    const p = y * w + x
    const si = p * 4
    const nd = dist[p] + 1
    // Left
    if (x > 0) {
      const np = p - 1
      if (dist[np] === -1) {
        dist[np] = nd
        const di = np * 4
        rgba[di] = rgba[si]
        rgba[di + 1] = rgba[si + 1]
        rgba[di + 2] = rgba[si + 2]
        qx[tail] = x - 1
        qy[tail] = y
        tail++
      }
    }
    // Right
    if (x < w - 1) {
      const np = p + 1
      if (dist[np] === -1) {
        dist[np] = nd
        const di = np * 4
        rgba[di] = rgba[si]
        rgba[di + 1] = rgba[si + 1]
        rgba[di + 2] = rgba[si + 2]
        qx[tail] = x + 1
        qy[tail] = y
        tail++
      }
    }
    // Up
    if (y > 0) {
      const np = p - w
      if (dist[np] === -1) {
        dist[np] = nd
        const di = np * 4
        rgba[di] = rgba[si]
        rgba[di + 1] = rgba[si + 1]
        rgba[di + 2] = rgba[si + 2]
        qx[tail] = x
        qy[tail] = y - 1
        tail++
      }
    }
    // Down
    if (y < h - 1) {
      const np = p + w
      if (dist[np] === -1) {
        dist[np] = nd
        const di = np * 4
        rgba[di] = rgba[si]
        rgba[di + 1] = rgba[si + 1]
        rgba[di + 2] = rgba[si + 2]
        qx[tail] = x
        qy[tail] = y + 1
        tail++
      }
    }
  }
}

// A few neighbor-averaging passes to soften seams between copied regions.
// Deliberately light: heavy diffusion would flatten the sampled texture
// back into a smear.
function diffuseMasked(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  coverage: Uint8Array
) {
  const THRESH = 100
  const idx: number[] = []
  for (let p = 0; p < w * h; p++) {
    if (coverage[p] >= THRESH) idx.push(p)
  }
  if (!idx.length) return

  const PASSES = 6
  for (let it = 0; it < PASSES; it++) {
    for (let k = 0; k < idx.length; k++) {
      const p = idx[k]
      const x = p % w
      const y = (p / w) | 0
      const a = x > 0 ? p - 1 : p
      const b = x < w - 1 ? p + 1 : p
      const c = y > 0 ? p - w : p
      const d = y < h - 1 ? p + w : p
      const i = p * 4
      rgba[i] = (rgba[a * 4] + rgba[b * 4] + rgba[c * 4] + rgba[d * 4]) / 4
      rgba[i + 1] =
        (rgba[a * 4 + 1] + rgba[b * 4 + 1] + rgba[c * 4 + 1] + rgba[d * 4 + 1]) / 4
      rgba[i + 2] =
        (rgba[a * 4 + 2] + rgba[b * 4 + 2] + rgba[c * 4 + 2] + rgba[d * 4 + 2]) / 4
    }
  }
}

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to create blob'))
    }, 'image/png')
  })
}

function base64ToBlob(base64: string, type = 'image/png'): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type })
}

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
