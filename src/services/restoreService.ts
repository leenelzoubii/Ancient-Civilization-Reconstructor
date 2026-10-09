// Artifact restoration client service.
// Talks to the Vercel Functions in /api so the OpenAI key never reaches
// the browser. Gemini and Pollinations were removed; the only remaining
// fallback is the local diffusion inpaint (Manual Mask mode only).
//
// Approximate cost (Oct 2026):
// - image edit ~$0.04-0.05 per medium-quality 1024px image
//   (gpt-image-2.5-sunburst: $30/M image output tokens, $8/M image input)
// - gpt-6-luna vision call well under a cent
//   ($0.10/M input, $0.50/M output; images dominate the token count)
// Worst case per restore = 2 image edits + 2 vision calls; the image
// edits dominate the cost.

export const USE_VISION_LAYER = true

const DIFF_THRESHOLD = 10 // mean abs diff over 0-255 scale
const MAX_EDITS = 2
const MAX_VISION_CALLS = 2
const MASK_DILATE_PX = 6
const MASK_FEATHER_PX = 3
const JUDGE_MAX_SIDE = 768

const EDIT_PROMPT_AUTO =
  'This is a photo of a damaged ancient artifact. Repair all visible damage: ' +
  'cracks, chips, scratches, stains, eroded areas and missing fragments, ' +
  'reconstructing missing parts consistently with the artifact\'s existing ' +
  'shape, material, texture and style. Keep the artifact\'s shape, colors, ' +
  'lighting, framing and background identical. Do not add new objects, text ' +
  'or decoration. Output the fully repaired image.'

const EDIT_PROMPT_MASK =
  'Repair ONLY the transparent masked region of this photo of an ancient ' +
  'artifact. Remove the cracks, chips or damage there and reconstruct the ' +
  'surface seamlessly, matching the surrounding material, texture, color and ' +
  'lighting. Do not change anything outside the masked region. Do not add ' +
  'new objects or text.'

const RETRY_SUFFIX =
  ' The previous attempt left damage visible: {remaining_damage}. Be more ' +
  'aggressive and completely remove every crack and chip.'

export type JudgeResult = {
  repaired: boolean | null
  unchanged_elsewhere: boolean | null
  remaining_damage: string
}

export type RestoreResult = {
  blob: Blob | null
  engine: 'ai' | 'local'
  failed: boolean
  diff: number | null
  judge: JudgeResult | null
  /** Real failure reason (API error text or verification message). */
  error?: string
  /** Why a local repair was applied instead of the AI edit. */
  fallbackReason?: string
}

type Coverage = { data: Uint8Array; width: number; height: number }

function logRestore(info: Record<string, unknown>) {
  if (import.meta.env.DEV) console.debug('[restore]', info)
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

export async function restoreAutomatic(
  imageBase64: string
): Promise<RestoreResult> {
  const originalUrl = `data:image/png;base64,${imageBase64}`

  let visionUsed = 0
  let description: string | null = null
  if (USE_VISION_LAYER) {
    visionUsed += 1
    description = await describeDamage(originalUrl).catch(() => null)
  }

  let basePrompt = EDIT_PROMPT_AUTO
  if (description) {
    const text = description.trim()
    basePrompt += ` Specifically repair: ${text.endsWith('.') ? text : `${text}.`}`
  }

  let lastDiff: number | null = null
  let lastJudge: JudgeResult | null = null
  let lastError: string | null = null

  for (let attempt = 1; attempt <= MAX_EDITS; attempt++) {
    const prompt =
      attempt === 1 ? basePrompt : basePrompt + retrySuffix(lastJudge)

    let edited: Blob
    try {
      edited = await callRestore(prompt, imageBase64, null)
    } catch (err) {
      // API-level failure (billing, rate limit, moderation, org check).
      // Retrying immediately would just burn money, so fail fast with the
      // real reason and surface it in the UI.
      lastError = err instanceof Error ? err.message : String(err)
      break
    }

    lastDiff = await computeDiff(originalUrl, edited, null)

    if (USE_VISION_LAYER && visionUsed < MAX_VISION_CALLS) {
      visionUsed += 1
      lastJudge = await judgeImages(originalUrl, edited, null).catch(() => null)
    }

    const passed = lastDiff > DIFF_THRESHOLD && lastJudge?.repaired !== false
    logRestore({ mode: 'auto', attempt, diff: lastDiff, judge: lastJudge, passed })
    if (passed) {
      return { blob: edited, engine: 'ai', failed: false, diff: lastDiff, judge: lastJudge }
    }
  }

  const reason = lastError ?? verificationFailureReason(lastDiff, lastJudge)
  return {
    blob: null,
    engine: 'ai',
    failed: true,
    diff: lastDiff,
    judge: lastJudge,
    error: reason,
  }
}

export async function restoreWithMask(
  imageBase64: string,
  maskSource: string
): Promise<RestoreResult> {
  const originalUrl = `data:image/png;base64,${imageBase64}`

  const img = await loadImage(originalUrl)
  const width = img.naturalWidth || img.width
  const height = img.naturalHeight || img.height

  const painted = await loadCoverage(maskSource, width, height)
  if (!painted.data.some(v => v >= 128)) {
    return {
      blob: null,
      engine: 'ai',
      failed: true,
      diff: null,
      judge: null,
      error: 'The mask is empty. Paint over the damaged areas first.',
    }
  }

  const dilated = dilateCoverage(painted, MASK_DILATE_PX)
  const feathered = featherCoverage(dilated, MASK_FEATHER_PX)
  const openAiMask = await buildOpenAiMaskBlob(dilated)

  let visionUsed = 0
  let lastDiff: number | null = null
  let lastJudge: JudgeResult | null = null
  let lastError: string | null = null

  for (let attempt = 1; attempt <= MAX_EDITS; attempt++) {
    const prompt =
      attempt === 1
        ? EDIT_PROMPT_MASK
        : EDIT_PROMPT_MASK + retrySuffix(lastJudge)

    let edited: Blob
    try {
      edited = await callRestore(prompt, imageBase64, openAiMask)
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      break
    }

    const blended = await blendByCoverage(originalUrl, edited, feathered)
    lastDiff = await computeDiff(originalUrl, blended, feathered)

    if (USE_VISION_LAYER && visionUsed < MAX_VISION_CALLS) {
      visionUsed += 1
      lastJudge = await judgeImages(originalUrl, blended, dilated).catch(
        () => null
      )
    }

    const passed = lastDiff > DIFF_THRESHOLD && lastJudge?.repaired !== false
    logRestore({ mode: 'manual', attempt, diff: lastDiff, judge: lastJudge, passed })
    if (passed) {
      return {
        blob: blended,
        engine: 'ai',
        failed: false,
        diff: lastDiff,
        judge: lastJudge,
      }
    }
  }

  // AI path failed (API error or verification) — Manual Mask mode keeps a
  // local diffusion inpaint fallback that visibly fills the painted region.
  const aiReason = lastError ?? verificationFailureReason(lastDiff, lastJudge)
  const localBlob = await localInpaint(imageBase64, dilated)
  const localDiff = await computeDiff(originalUrl, localBlob, feathered)
  logRestore({ mode: 'manual-local', diff: localDiff })
  if (localDiff > DIFF_THRESHOLD) {
    return {
      blob: localBlob,
      engine: 'local',
      failed: false,
      diff: localDiff,
      judge: null,
      fallbackReason: `The AI edit did not visibly work, so a local repair was applied instead. (${aiReason})`,
    }
  }

  return {
    blob: null,
    engine: 'ai',
    failed: true,
    diff: lastDiff,
    judge: lastJudge,
    error: aiReason,
  }
}

function retrySuffix(judge: JudgeResult | null): string {
  const remaining = judge?.remaining_damage?.trim()
  return RETRY_SUFFIX.replace(
    '{remaining_damage}',
    remaining && remaining.toLowerCase() !== 'none' && remaining !== ''
      ? remaining
      : 'damage still visible'
  )
}

function verificationFailureReason(
  diff: number | null,
  judge: JudgeResult | null
): string {
  if (judge?.repaired === false && judge.remaining_damage) {
    return `The AI reported remaining damage: ${judge.remaining_damage}`
  }
  if (diff !== null) {
    return `No visible change was detected in the result (diff ${diff.toFixed(
      1
    )}/255, threshold ${DIFF_THRESHOLD}).`
  }
  return 'Restoration failed.'
}

// ---------------------------------------------------------------------------
// OpenAI image edit via serverless function
// ---------------------------------------------------------------------------

async function callRestore(
  prompt: string,
  imageBase64: string,
  mask: Blob | null
): Promise<Blob> {
  const form = new FormData()
  form.append('prompt', prompt)
  form.append('image', base64ToBlob(imageBase64, 'image/png'), 'image.png')
  if (mask) form.append('mask', mask, 'mask.png')

  const res = await fetch('/api/restore', { method: 'POST', body: form })
  const text = await res.text()

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
  if (!b64) throw new Error(extractError(text, res.status))
  return base64ToBlob(b64, 'image/png')
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

async function describeDamage(originalUrl: string): Promise<string | null> {
  const data = await postJson('/api/vision', {
    mode: 'describe',
    images: [originalUrl],
  })
  const text = typeof data?.text === 'string' ? data.text.trim() : ''
  return text || null
}

async function judgeImages(
  beforeUrl: string,
  afterBlob: Blob,
  crop: Coverage | null
): Promise<JudgeResult | null> {
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

async function localInpaint(
  imageBase64: string,
  coverage: Coverage
): Promise<Blob> {
  const img = await loadImage(`data:image/png;base64,${imageBase64}`)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const originalData = ctx.getImageData(0, 0, w, h)

  const filled = new Uint8ClampedArray(originalData.data)
  inpaintMasked(filled, w, h, coverage.data)

  const result = ctx.createImageData(w, h)
  for (let i = 0; i < originalData.data.length; i += 4) {
    const a = coverage.data[i / 4] / 255
    for (let c = 0; c < 3; c++) {
      result.data[i + c] = Math.round(
        originalData.data[i + c] * (1 - a) + filled[i + c] * a
      )
    }
    result.data[i + 3] = 255
  }
  ctx.putImageData(result, 0, 0)
  return canvasToBlob(canvas)
}

function inpaintMasked(
  rgba: Uint8ClampedArray,
  w: number,
  h: number,
  coverage: Uint8Array
) {
  const THRESH = 100
  const idx: number[] = []
  let minX = w - 1
  let minY = h - 1
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (coverage[y * w + x] >= THRESH) {
        idx.push(y * w + x)
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (!idx.length) return

  const M = 6
  const bx0 = Math.max(0, minX - M)
  const by0 = Math.max(0, minY - M)
  const bx1 = Math.min(w - 1, maxX + M)
  const by1 = Math.min(h - 1, maxY + M)

  let sr = 0
  let sg = 0
  let sb = 0
  let n = 0
  for (let y = by0; y <= by1; y++) {
    for (let x = bx0; x <= bx1; x++) {
      const p = y * w + x
      if (coverage[p] < THRESH) {
        const i = p * 4
        sr += rgba[i]
        sg += rgba[i + 1]
        sb += rgba[i + 2]
        n++
      }
    }
  }
  if (!n) return
  const ir = sr / n
  const ig = sg / n
  const ib = sb / n
  const count = idx.length
  const xs = new Int32Array(count)
  const ys = new Int32Array(count)
  const ps = new Int32Array(count)
  for (let k = 0; k < count; k++) {
    const p = idx[k]
    ps[k] = p
    xs[k] = p % w
    ys[k] = (p / w) | 0
    rgba[p * 4] = ir
    rgba[p * 4 + 1] = ig
    rgba[p * 4 + 2] = ib
  }

  const depth = Math.ceil(Math.max(maxX - minX, maxY - minY) / 2) + M
  let iters = Math.max(300, Math.min(4000, depth * depth))
  const budget = 200_000_000
  if (count * iters > budget) {
    iters = Math.max(100, Math.floor(budget / count))
  }

  for (let it = 0; it < iters; it++) {
    for (let k = 0; k < count; k++) {
      const p = ps[k]
      const x = xs[k]
      const y = ys[k]
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

  for (let k = 0; k < count; k++) {
    const i = ps[k] * 4
    const grain = (Math.random() * 6 - 3) * (coverage[ps[k]] / 255)
    rgba[i] += grain
    rgba[i + 1] += grain
    rgba[i + 2] += grain
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
