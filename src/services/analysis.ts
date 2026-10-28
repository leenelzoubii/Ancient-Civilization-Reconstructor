/**
 * Local analysis of an artifact repair for the result page.
 *
 * Everything here runs in the browser: background segmentation, object area,
 * repaired area and k-means colour extraction from the uploaded photo. No
 * pixels leave the device and no bundled reference images are used.
 *
 * The repaired percentage is measured against the object, not the whole
 * photo: it is the share of the object that the user painted (manual mode) or
 * the local detector marked (auto mode). Everything else is untouched.
 */

const ANALYSIS_SIDE = 340

export type ArtifactAnalysis = {
  /** Percentage of the object that was repaired. */
  restoredPct: number
  /** Object area as a share of the whole photo (0-100). */
  objectPct: number
  /** Colours sampled from the object in the uploaded photo. */
  palette: string[]
  paletteSource: 'the uploaded photo'
  /** Repaired image with the repaired pixels tinted. */
  overlayUrl: string | null
  width: number
  height: number
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

function loadImage(src: string): Promise<HTMLImageElement> {
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
function segment(px: Pixels, bg: ReturnType<typeof estimateBackground>): Mask {
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
  // Majority filter removes speckle from textured backgrounds.
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
  return mask
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

function paletteFromPhoto(px: Pixels, mask: Mask): string[] {
  const { data } = px
  const samples: number[][] = []
  const step = Math.max(1, Math.floor(data.length / 4 / 4000))
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
  /** The brush / auto-detected mask canvas. */
  paintedMask?: HTMLCanvasElement | null
}

export async function analyzeArtifact(opts: AnalyzeOptions): Promise<ArtifactAnalysis> {
  const original = await loadImage(opts.originalUrl)
  const px = readPixels(original)
  const { width, height } = px
  const bg = estimateBackground(px)
  const mask = segment(px, bg)

  const damage = opts.paintedMask
    ? paintedDamage(opts.paintedMask, width, height)
    : new Uint8Array(width * height)

  let objectCount = 0
  let damaged = 0
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i]) continue
    objectCount++
    if (damage[i]) damaged++
  }
  const objectPct = (objectCount / (width * height)) * 100
  const restoredPct = objectCount ? (damaged / objectCount) * 100 : 0

  // Overlay: the repaired photo with the repaired pixels tinted. One colour
  // only — the AI fills a single damage mask, it does not mirror the object.
  let overlayUrl: string | null = null
  try {
    const restored = await loadImage(opts.restoredUrl)
    const canvas = makeCanvas(width, height)
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(restored, 0, 0, width, height)
    const out = ctx.getImageData(0, 0, width, height)
    const d = out.data
    const tint = [214, 92, 66]
    const alpha = 0.55
    for (let i = 0; i < damage.length; i++) {
      if (!damage[i] || !mask[i]) continue
      d[i * 4] = d[i * 4] * (1 - alpha) + tint[0] * alpha
      d[i * 4 + 1] = d[i * 4 + 1] * (1 - alpha) + tint[1] * alpha
      d[i * 4 + 2] = d[i * 4 + 2] * (1 - alpha) + tint[2] * alpha
    }
    ctx.putImageData(out, 0, 0)
    overlayUrl = canvas.toDataURL('image/png')
  } catch {
    overlayUrl = null
  }

  return {
    restoredPct,
    objectPct,
    palette: paletteFromPhoto(px, mask).slice(0, 5),
    paletteSource: 'the uploaded photo',
    overlayUrl,
    width,
    height,
  }
}
