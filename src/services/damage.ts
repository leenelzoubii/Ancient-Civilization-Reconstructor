/**
 * Local damage detection for the automatic restoration mode.
 *
 * The automatic mode used to mark the whole photograph as damaged, which let
 * the image model redraw the entire artifact. This module finds the actual
 * cracks, dark imperfections and small missing pieces instead, so the AI is
 * only allowed to change those pixels. Everything else is composited from the
 * original photo untouched.
 *
 * It is deliberately conservative: a clean photo should produce an empty (or
 * almost empty) mask, and a very busy mask is trimmed to its strongest lines.
 */

export type DetectedDamage = {
  /** Mask at the photo's natural size: white + opaque = repair here. */
  mask: HTMLCanvasElement
  /** Share of the whole photo covered by the mask (0-1). */
  fraction: number
  /** Number of damaged pixels at detection size. */
  pixels: number
  /** False when the photo looks clean (nothing worth repairing). */
  found: boolean
}

const MAX_SIDE = 720
const BG_DISTANCE = 30
const ERODE_PASSES = 3
const BLUR_RADIUS = 3
/** Cap on the share of the object the automatic mask may cover. */
const MAX_OBJECT_COVERAGE = 0.22
/** Small holes (chips) larger than this share of the object are left alone. */
const MAX_HOLE_SHARE = 0.02

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('This image could not be opened.'))
    img.src = src
  })
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

/** Separable box blur over a float luminance plane. */
function boxBlur(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  const tmp = new Float32Array(w * h)
  const out = new Float32Array(w * h)
  const span = radius * 2 + 1
  for (let y = 0; y < h; y++) {
    const row = y * w
    let sum = 0
    for (let x = -radius; x <= radius; x++) sum += src[row + Math.min(w - 1, Math.max(0, x))]
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / span
      sum -= src[row + Math.min(w - 1, Math.max(0, x - radius))]
      sum += src[row + Math.min(w - 1, Math.max(0, x + radius + 1))]
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0
    for (let y = -radius; y <= radius; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x]
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / span
      sum -= tmp[Math.min(h - 1, Math.max(0, y - radius)) * w + x]
      sum += tmp[Math.min(h - 1, Math.max(0, y + radius + 1)) * w + x]
    }
  }
  return out
}

function median(values: number[]): number {
  if (!values.length) return 255
  values.sort((a, b) => a - b)
  return values[values.length >> 1]
}

/** 8-neighbour erosion; keeps the mask away from the silhouette edge. */
function erode(mask: Uint8Array, w: number, h: number, passes: number): Uint8Array {
  let src = mask
  for (let p = 0; p < passes; p++) {
    const out = new Uint8Array(w * h)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x
        if (!src[i]) continue
        let all = 1
        for (let dy = -1; dy <= 1 && all; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!src[i + dy * w + dx]) {
              all = 0
              break
            }
          }
        }
        out[i] = all
      }
    }
    src = out
  }
  return src
}

/** 8-neighbour dilation, used to make thin crack lines continuous. */
function dilate(mask: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      if (mask[i]) {
        out[i] = 1
        continue
      }
      if (
        mask[i - 1] ||
        mask[i + 1] ||
        mask[i - w] ||
        mask[i + w] ||
        mask[i - w - 1] ||
        mask[i - w + 1] ||
        mask[i + w - 1] ||
        mask[i + w + 1]
      ) {
        out[i] = 1
      }
    }
  }
  return out
}

export async function detectDamage(imageUrl: string): Promise<DetectedDamage> {
  const img = await loadImage(imageUrl)
  const naturalW = img.naturalWidth || img.width
  const naturalH = img.naturalHeight || img.height
  if (!naturalW || !naturalH) throw new Error('This image could not be read.')

  const scale = Math.min(1, MAX_SIDE / Math.max(naturalW, naturalH))
  const w = Math.max(24, Math.round(naturalW * scale))
  const h = Math.max(24, Math.round(naturalH * scale))

  const canvas = makeCanvas(w, h)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  // Backdrop = median colour of the border.
  const border: number[][] = []
  const pushBorder = (x: number, y: number) => {
    const i = (y * w + x) * 4
    if (data[i + 3] >= 40) border.push([data[i], data[i + 1], data[i + 2]])
  }
  for (let x = 0; x < w; x += 2) {
    pushBorder(x, 0)
    pushBorder(x, h - 1)
  }
  for (let y = 0; y < h; y += 2) {
    pushBorder(0, y)
    pushBorder(w - 1, y)
  }
  const transparent = border.length === 0
  const bg = [
    median(border.map((p) => p[0])),
    median(border.map((p) => p[1])),
    median(border.map((p) => p[2])),
  ]

  const lum = new Float32Array(w * h)
  const object = new Uint8Array(w * h)
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    lum[p] = 0.299 * r + 0.587 * g + 0.114 * b
    if (data[i + 3] < 40) continue
    if (transparent) {
      object[p] = 1
    } else {
      const d = Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2)
      if (d > BG_DISTANCE) object[p] = 1
    }
  }

  const interior = erode(object, w, h, ERODE_PASSES)
  const blur = boxBlur(lum, w, h, BLUR_RADIUS)

  // Dark, thin deviations from the local surface = cracks and speckles.
  const hp = new Float32Array(w * h)
  let count = 0
  let sum = 0
  let sumSq = 0
  for (let p = 0; p < w * h; p++) {
    if (!interior[p]) continue
    const v = blur[p] - lum[p]
    if (v <= 0) continue
    hp[p] = v
    count++
    sum += v
    sumSq += v * v
  }
  if (!count) {
    const mask = makeCanvas(naturalW, naturalH)
    return { mask, fraction: 0, pixels: 0, found: false }
  }
  const mean = sum / count
  const std = Math.sqrt(Math.max(0, sumSq / count - mean * mean))
  let threshold = Math.max(9, mean + 1.35 * std)

  const candidates = new Uint8Array(w * h)
  const take = (t: number) => {
    let n = 0
    candidates.fill(0)
    for (let p = 0; p < w * h; p++) {
      if (interior[p] && hp[p] > t) {
        candidates[p] = 1
        n++
      }
    }
    return n
  }
  let damaged = take(threshold)

  // A very busy mask would let the model redraw too much: keep the strongest
  // lines only. This also protects photos with heavy surface texture.
  const cap = Math.max(64, Math.round(count * MAX_OBJECT_COVERAGE))
  if (damaged > cap) {
    // Histogram of positive high-pass values, then walk down from 255.
    const hist = new Uint32Array(256)
    for (let p = 0; p < w * h; p++) {
      if (interior[p] && hp[p] > 0) hist[Math.min(255, Math.round(hp[p]))]++
    }
    let running = 0
    let t = 255
    for (; t > 0; t--) {
      running += hist[t]
      if (running >= cap) break
    }
    threshold = Math.max(threshold, t)
    damaged = take(threshold)
  }

  // Drop isolated pixels (noise), then join the remaining line fragments.
  const cleaned = new Uint8Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x
      if (!candidates[p]) continue
      let neighbours = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if ((dx || dy) && candidates[p + dy * w + dx]) neighbours++
        }
      }
      if (neighbours >= 2) cleaned[p] = 1
    }
  }

  // Small enclosed background holes = chips and missing pieces. Large holes
  // (a vase opening, a window) are left alone.
  const reachable = new Uint8Array(w * h)
  const stack: number[] = []
  for (let x = 0; x < w; x++) {
    stack.push(x, (h - 1) * w + x)
  }
  for (let y = 0; y < h; y++) {
    stack.push(y * w, y * w + w - 1)
  }
  while (stack.length) {
    const p = stack.pop() as number
    if (p < 0 || p >= w * h || reachable[p] || object[p]) continue
    reachable[p] = 1
    const x = p % w
    const y = (p / w) | 0
    if (x > 0) stack.push(p - 1)
    if (x < w - 1) stack.push(p + 1)
    if (y > 0) stack.push(p - w)
    if (y < h - 1) stack.push(p + w)
  }
  let objectCount = 0
  for (let p = 0; p < w * h; p++) if (object[p]) objectCount++
  const holeLimit = Math.max(12, Math.round(objectCount * MAX_HOLE_SHARE))
  const seen = new Uint8Array(w * h)
  for (let p = 0; p < w * h; p++) {
    if (object[p] || reachable[p] || seen[p]) continue
    const component: number[] = []
    const local: number[] = [p]
    seen[p] = 1
    while (local.length) {
      const q = local.pop() as number
      component.push(q)
      const x = q % w
      const y = (q / w) | 0
      const push = (n: number) => {
        if (n >= 0 && n < w * h && !seen[n] && !object[n] && !reachable[n]) {
          seen[n] = 1
          local.push(n)
        }
      }
      if (x > 0) push(q - 1)
      if (x < w - 1) push(q + 1)
      if (y > 0) push(q - w)
      if (y < h - 1) push(q + w)
    }
    if (component.length > 6 && component.length < holeLimit) {
      for (const q of component) cleaned[q] = 1
    }
  }

  const solid = dilate(cleaned, w, h)
  let pixels = 0
  for (let p = 0; p < w * h; p++) if (solid[p]) pixels++

  // Paint the mask at the photo's natural size.
  const small = makeCanvas(w, h)
  const sctx = small.getContext('2d')!
  const image = sctx.createImageData(w, h)
  for (let p = 0; p < w * h; p++) {
    if (!solid[p]) continue
    const i = p * 4
    image.data[i] = 255
    image.data[i + 1] = 255
    image.data[i + 2] = 255
    image.data[i + 3] = 255
  }
  sctx.putImageData(image, 0, 0)

  const mask = makeCanvas(naturalW, naturalH)
  const mctx = mask.getContext('2d')!
  mctx.imageSmoothingEnabled = true
  mctx.drawImage(small, 0, 0, naturalW, naturalH)

  const fraction = pixels / (w * h)
  return {
    mask,
    fraction,
    pixels,
    // ~0.03% of the photo is the smallest useful repair; below that the
    // automatic result would be indistinguishable from the original.
    found: pixels > w * h * 0.0003,
  }
}
