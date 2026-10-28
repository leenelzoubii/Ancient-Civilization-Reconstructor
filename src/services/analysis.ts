/**
 * Analysis of an artifact photo for the result page.
 *
 * Everything here runs locally in the browser: background segmentation,
 * symmetry detection, damage estimation and k-means colour extraction from
 * the bundled reference images. No pixels leave the device.
 *
 * The numbers are deliberately conservative: the damage area is either the
 * mask the user painted (manual mode) or the part of the object that does not
 * match its own mirror image (auto mode), divided by the object's area.
 */

import { referenceImages } from '../references'

const ANALYSIS_SIDE = 340

export type ArtifactAnalysis = {
  /** Percentage of the object that was rebuilt. */
  restoredPct: number
  /** Part of restoredPct rebuilt by mirroring the matching side. */
  mirroredPct: number
  /** Part of restoredPct inferred from the surrounding colours. */
  inferredPct: number
  /** How closely the object matches its own mirror image (0-100). */
  symmetryPct: number
  /** Object area as a share of the whole photo (0-100). */
  objectPct: number
  palette: string[]
  paletteSource: 'reference images' | 'the uploaded photo'
  /** Restored image with the rebuilt areas tinted. */
  overlayUrl: string | null
  width: number
  height: number
  references: number
}

type Mask = Uint8Array

type Pixels = {
  data: Uint8ClampedArray
  width: number
  height: number
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return c
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('This image could not be opened.'))
    img.src = src
  })
}

function readPixels(img: HTMLImageElement, maxSide = ANALYSIS_SIDE): Pixels {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(8, Math.round(img.naturalWidth * scale))
  const height = Math.max(8, Math.round(img.naturalHeight * scale))
  const canvas = makeCanvas(width, height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, width, height)
  return { data: ctx.getImageData(0, 0, width, height).data, width, height }
}

/** Median colour of the photo border; transparent when most of it is empty. */
function estimateBackground({ data, width, height }: Pixels) {
  const R: number[] = []
  const G: number[] = []
  const B: number[] = []
  let transparent = 0
  let n = 0
  const take = (x: number, y: number) => {
    const i = (y * width + x) * 4
    n++
    if (data[i + 3] < 30) {
      transparent++
      return
    }
    R.push(data[i])
    G.push(data[i + 1])
    B.push(data[i + 2])
  }
  for (let x = 0; x < width; x += 2) {
    take(x, 0)
    take(x, height - 1)
  }
  for (let y = 0; y < height; y += 2) {
    take(0, y)
    take(width - 1, y)
  }
  const median = (a: number[]) => {
    if (!a.length) return 255
    a.sort((p, q) => p - q)
    return a[a.length >> 1]
  }
  return {
    rgb: [median(R), median(G), median(B)] as [number, number, number],
    transparent: transparent > n * 0.5,
  }
}

/** Otsu threshold on the colour distance from the background. */
function segment(px: Pixels, bg: ReturnType<typeof estimateBackground>): { mask: Mask; bb: BBox } {
  const { data, width, height } = px
  const dist = new Float32Array(width * height)
  const hist = new Float64Array(443)
  for (let i = 0, p = 0; i < dist.length; i++, p += 4) {
    const dr = data[p] - bg.rgb[0]
    const dg = data[p + 1] - bg.rgb[1]
    const db = data[p + 2] - bg.rgb[2]
    dist[i] = Math.sqrt(dr * dr + dg * dg + db * db)
    if (data[p + 3] >= 40) hist[Math.min(442, Math.round(dist[i]))]++
  }
  let total = 0
  let sum = 0
  for (let t = 0; t < 443; t++) {
    total += hist[t]
    sum += t * hist[t]
  }
  let wB = 0
  let sB = 0
  let best = 0
  let otsu = 30
  for (let t = 0; t < 443; t++) {
    wB += hist[t]
    if (!wB) continue
    const wF = total - wB
    if (!wF) break
    sB += t * hist[t]
    const mB = sB / wB
    const mF = (sum - sB) / wF
    const v = wB * wF * (mB - mF) * (mB - mF)
    if (v > best) {
      best = v
      otsu = t
    }
  }
  const threshold = Math.max(18, Math.min(120, otsu))
  let mask: Mask = new Uint8Array(width * height)
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    if (bg.transparent || (data[p + 3] >= 40 && dist[i] > threshold)) mask[i] = 1
  }
  // majority filter removes speckle from textured backgrounds
  for (let pass = 0; pass < 2; pass++) {
    const out = new Uint8Array(width * height)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let s = 0
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) s += mask[(y + dy) * width + x + dx]
        }
        out[y * width + x] = s >= 5 ? 1 : 0
      }
    }
    mask = out
  }
  return { mask, bb: bbox(mask, width, height) }
}

type BBox = { minX: number; minY: number; maxX: number; maxY: number; count: number }

function bbox(mask: Mask, width: number, height: number): BBox {
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  let count = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue
      count++
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  return { minX, minY, maxX, maxY, count }
}

/** Most common midpoint between the row edges = the vertical mirror axis. */
function findAxis(mask: Mask, width: number, height: number, bb: BBox): number {
  if (bb.count === 0) return width / 2
  const bins = new Float32Array(width)
  for (let y = bb.minY; y <= bb.maxY; y++) {
    let l = -1
    let r = -1
    for (let x = bb.minX; x <= bb.maxX; x++) {
      if (!mask[y * width + x]) continue
      if (l < 0) l = x
      r = x
    }
    if (l >= 0 && r - l > 3) bins[Math.round((l + r) / 2)] += 1
  }
  let peak = Math.round((bb.minX + bb.maxX) / 2)
  let pv = -1
  for (let x = 2; x < width - 2; x++) {
    const v =
      bins[x - 2] + 2 * bins[x - 1] + 3 * bins[x] + 2 * bins[x + 1] + bins[x + 2]
    if (v > pv) {
      pv = v
      peak = x
    }
  }
  let sw = 0
  let sx = 0
  for (let x = Math.max(0, peak - 3); x <= Math.min(width - 1, peak + 3); x++) {
    sw += bins[x]
    sx += bins[x] * x
  }
  return sw ? sx / sw : peak
}

function symmetryScore(mask: Mask, width: number, bb: BBox, axis: number): number {
  let inter = 0
  let n = 0
  for (let y = bb.minY; y <= bb.maxY; y += 2) {
    for (let x = bb.minX; x <= bb.maxX; x += 2) {
      if (!mask[y * width + x]) continue
      n++
      const mx = Math.round(2 * axis - x)
      if (mx >= 0 && mx < width && mask[y * width + mx]) inter++
    }
  }
  return n ? inter / (2 * n - inter) : 0
}

/** Pixels of the object that differ strongly from their own mirror image. */
function autoDamage(px: Pixels, mask: Mask, axis: number): Mask {
  const { data, width, height } = px
  const out = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (!mask[i]) continue
      const mx = Math.round(2 * axis - x)
      if (mx < 0 || mx >= width) continue
      const j = y * width + mx
      if (!mask[j]) {
        out[i] = 1
        continue
      }
      const dr = data[i * 4] - data[j * 4]
      const dg = data[i * 4 + 1] - data[j * 4 + 1]
      const db = data[i * 4 + 2] - data[j * 4 + 2]
      if (Math.sqrt(dr * dr + dg * dg + db * db) > 58) out[i] = 1
    }
  }
  // remove single-pixel noise so the percentages stay stable
  const smooth = new Uint8Array(out)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x
      if (!out[i]) continue
      let n = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) n += out[(y + dy) * width + x + dx]
      }
      if (n < 4) smooth[i] = 0
    }
  }
  return smooth
}

/** Painted mask, resampled to the analysis size. */
function paintedDamage(maskCanvas: HTMLCanvasElement, width: number, height: number): Mask {
  const canvas = makeCanvas(width, height)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(maskCanvas, 0, 0, width, height)
  const d = ctx.getImageData(0, 0, width, height).data
  const out = new Uint8Array(width * height)
  for (let i = 0; i < out.length; i++) if (d[i * 4 + 3] > 60) out[i] = 1
  return out
}

function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')
  return `#${h(r)}${h(g)}${h(b)}`
}

/** k-means over the reference images, falling back to the photo itself. */
async function paletteFromReferences(civId: string): Promise<string[] | null> {
  const urls = referenceImages(civId)
  if (!urls.length) return null
  const samples: number[][] = []
  for (const url of urls) {
    try {
      const img = await loadImage(url)
      const { data, width, height } = readPixels(img, 96)
      const step = Math.max(1, Math.floor((width * height) / 260))
      for (let i = 0; i < width * height; i += step) {
        samples.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]])
      }
    } catch {
      /* skip an unreadable reference */
    }
  }
  if (samples.length < 30) return null
  return kmeans(samples, 5).map((c) => rgbToHex(c[0], c[1], c[2]))
}

function paletteFromPhoto(px: Pixels, mask: Mask): string[] {
  const { data } = px
  const samples: number[][] = []
  const step = Math.max(1, Math.floor((data.length / 4) / 4000))
  for (let i = 0; i < mask.length; i += step) {
    if (!mask[i]) continue
    samples.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]])
  }
  if (!samples.length) return ['#b8862b', '#a4502f', '#2f6b55', '#23466b', '#d9a92e']
  return kmeans(samples, 5).map((c) => rgbToHex(c[0], c[1], c[2]))
}

function kmeans(samples: number[][], k: number): number[][] {
  const cents: number[][] = []
  for (let i = 0; i < k; i++) {
    cents.push(samples[Math.floor(((i + 0.5) / k) * samples.length)].slice())
  }
  const assign = new Int32Array(samples.length)
  for (let it = 0; it < 10; it++) {
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i]
      let bi = 0
      let bd = Infinity
      for (let j = 0; j < cents.length; j++) {
        const c = cents[j]
        const dd = (s[0] - c[0]) ** 2 + (s[1] - c[1]) ** 2 + (s[2] - c[2]) ** 2
        if (dd < bd) {
          bd = dd
          bi = j
        }
      }
      assign[i] = bi
    }
    const sums = cents.map(() => [0, 0, 0, 0])
    for (let i = 0; i < samples.length; i++) {
      const a = sums[assign[i]]
      const s = samples[i]
      a[0] += s[0]
      a[1] += s[1]
      a[2] += s[2]
      a[3]++
    }
    sums.forEach((a, j) => {
      if (a[3]) cents[j] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]
    })
  }
  const counts = cents.map(() => 0)
  for (let i = 0; i < assign.length; i++) counts[assign[i]]++
  return cents
    .map((c, i) => ({ c, n: counts[i] }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n)
    .map((x) => x.c)
}

export type AnalyzeOptions = {
  originalUrl: string
  restoredUrl: string
  mode: 'manual' | 'auto'
  civId: string
  /** The brush overlay canvas (manual mode). */
  paintedMask?: HTMLCanvasElement | null
}

export async function analyzeArtifact(opts: AnalyzeOptions): Promise<ArtifactAnalysis> {
  const original = await loadImage(opts.originalUrl)
  const px = readPixels(original)
  const { width, height } = px
  const bg = estimateBackground(px)
  const { mask, bb } = segment(px, bg)
  const axis = findAxis(mask, width, height, bb)
  const symmetry = symmetryScore(mask, width, bb, axis)

  const damage = opts.paintedMask
    ? paintedDamage(opts.paintedMask, width, height)
    : autoDamage(px, mask, axis)

  let objectCount = 0
  let damaged = 0
  let mirrored = 0
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      if (!mask[i]) continue
      objectCount++
      if (!damage[i]) continue
      damaged++
      const mx = Math.round(2 * axis - x)
      const j = y * width + mx
      const counterpartOk = mx >= 0 && mx < width && mask[j] && !damage[j]
      if (counterpartOk) mirrored++
    }
  }
  const objectPct = (objectCount / (width * height)) * 100
  const restoredPct = objectCount ? (damaged / objectCount) * 100 : 0
  const mirroredPct = objectCount ? (mirrored / objectCount) * 100 : 0
  const inferredPct = Math.max(0, restoredPct - mirroredPct)

  // Overlay: the reconstructed photo with the rebuilt areas tinted.
  let overlayUrl: string | null = null
  try {
    const restored = await loadImage(opts.restoredUrl)
    const canvas = makeCanvas(width, height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(restored, 0, 0, width, height)
    const out = ctx.getImageData(0, 0, width, height)
    const d = out.data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x
        if (!damage[i] || !mask[i]) continue
        const mx = Math.round(2 * axis - x)
        const j = y * width + mx
        const isMirror = mx >= 0 && mx < width && mask[j] && !damage[j]
        const tint = isMirror ? [232, 167, 52] : [214, 92, 66]
        const a = 0.55
        d[i * 4] = d[i * 4] * (1 - a) + tint[0] * a
        d[i * 4 + 1] = d[i * 4 + 1] * (1 - a) + tint[1] * a
        d[i * 4 + 2] = d[i * 4 + 2] * (1 - a) + tint[2] * a
      }
    }
    ctx.putImageData(out, 0, 0)
    overlayUrl = canvas.toDataURL('image/png')
  } catch {
    overlayUrl = null
  }

  let palette = await paletteFromReferences(opts.civId)
  const paletteSource: ArtifactAnalysis['paletteSource'] = palette
    ? 'reference images'
    : 'the uploaded photo'
  if (!palette) palette = paletteFromPhoto(px, mask)

  return {
    restoredPct,
    mirroredPct,
    inferredPct,
    symmetryPct: symmetry * 100,
    objectPct,
    palette: palette.slice(0, 5),
    paletteSource,
    overlayUrl,
    width,
    height,
    references: 9,
  }
}
