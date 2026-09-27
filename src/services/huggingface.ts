const POLLINATIONS_KEY = import.meta.env.VITE_POLLINATIONS_KEY
const POLLINATIONS_URL = 'https://gen.pollinations.ai/v1/images/edits'
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'

const RESTORE_PROMPT =
  'Please analyze the uploaded image carefully and identify all cracks, ' +
  'breaks, or visible artifacts. Restore the image by seamlessly repairing ' +
  'these imperfections so that the final result looks fully mended, smooth, ' +
  'and pristine. Remove any signs of damage or disruption in texture and ' +
  'color, making the image appear natural, flawless, and as if it was never ' +
  'broken or damaged. Focus on perfecting details to preserve the original ' +
  'style and quality while eliminating all visual defects.'

export type RestoreResult = {
  blob: Blob
  engine: 'ai' | 'local'
  fallbackReason?: string
}

export async function restoreWithMask(
  imageBase64: string,
  maskBase64: string
): Promise<RestoreResult> {
  try {
    const ai = await aiRestore(imageBase64)
    const blended = await blendMasked(imageBase64, ai, maskBase64)
    return { blob: blended, engine: 'ai' }
  } catch (err) {
    return {
      blob: await localProcess(imageBase64, maskBase64),
      engine: 'local',
      fallbackReason: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function restoreAutomatic(
  imageBase64: string
): Promise<RestoreResult> {
  try {
    return { blob: await aiRestore(imageBase64), engine: 'ai' }
  } catch (err) {
    return {
      blob: await localProcess(imageBase64, null),
      engine: 'local',
      fallbackReason: err instanceof Error ? err.message : String(err),
    }
  }
}

async function aiRestore(imageBase64: string): Promise<Blob> {
  const errors: string[] = []

  if (GEMINI_KEY) {
    try {
      return await geminiRestore(imageBase64)
    } catch (err) {
      errors.push(`Gemini: ${err instanceof Error ? err.message : err}`)
    }
  }

  if (POLLINATIONS_KEY) {
    try {
      return await pollinationsRestore(imageBase64)
    } catch (err) {
      errors.push(`Pollinations: ${err instanceof Error ? err.message : err}`)
    }
  }

  if (!GEMINI_KEY && !POLLINATIONS_KEY) {
    throw new Error('No AI provider key configured')
  }
  throw new Error(errors.join(' | ') || 'All AI providers failed')
}

async function geminiRestore(imageBase64: string): Promise<Blob> {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY! },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: RESTORE_PROMPT },
            { inline_data: { mime_type: 'image/png', data: imageBase64 } },
          ],
        },
      ],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data?.error?.message || data?.detail || ''
    } catch {
      detail = await res.text().catch(() => '')
    }
    throw new Error(`Gemini restore failed (${res.status}): ${detail}`)
  }

  const data = await res.json().catch(() => null)
  const parts = data?.candidates?.[0]?.content?.parts || []
  const inline = parts.find(
    (p: { inlineData?: { data?: string; mimeType?: string }; inline_data?: { data?: string } }) =>
      p.inlineData?.data || p.inline_data?.data
  )
  const b64 = inline?.inlineData?.data || inline?.inline_data?.data
  if (!b64) {
    const blockReason =
      data?.promptFeedback?.blockReason ||
      data?.candidates?.[0]?.finishReason ||
      data?.error?.message ||
      'no image in response'
    throw new Error(`Gemini returned no image (${blockReason})`)
  }
  const mime = inline?.inlineData?.mimeType || 'image/png'
  return base64ToBlob(b64, mime)
}

async function pollinationsRestore(imageBase64: string): Promise<Blob> {
  const form = new FormData()
  form.append('image', base64ToBlob(imageBase64), 'artifact.png')
  form.append('prompt', RESTORE_PROMPT)
  form.append('model', 'kontext')

  const res = await fetch(POLLINATIONS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${POLLINATIONS_KEY!}` },
    body: form,
  })

  if (!res.ok) {
    let detail = ''
    try {
      const data = await res.json()
      detail = data?.error?.message || data?.detail || ''
    } catch {
      detail = await res.text().catch(() => '')
    }
    throw new Error(`restore failed (${res.status}): ${detail}`)
  }

  const data = await res.json().catch(() => null)
  const b64 = data?.data?.[0]?.b64_json
  if (!b64) {
    const detail =
      data?.error?.message || data?.detail || 'AI restore returned no image'
    throw new Error(detail)
  }
  return base64ToBlob(b64, 'image/jpeg')
}

async function blendMasked(
  imageBase64: string,
  aiBlob: Blob,
  maskBase64: string
): Promise<Blob> {
  const original = await loadImage(`data:image/png;base64,${imageBase64}`)
  const restored = await loadImage(await blobToDataUrl(aiBlob))
  const mask = await loadImage(`data:image/png;base64,${maskBase64}`)

  const w = original.naturalWidth || original.width
  const h = original.naturalHeight || original.height

  const drawScaled = (img: HTMLImageElement) => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    return ctx.getImageData(0, 0, w, h)
  }

  const origData = drawScaled(original)
  const restoredData = drawScaled(restored)
  const maskData = drawScaled(mask)

  const out = new ImageData(w, h)
  for (let i = 0; i < out.data.length; i += 4) {
    const alpha = maskData.data[i] / 255
    for (let c = 0; c < 3; c++) {
      out.data[i + c] = Math.round(
        origData.data[i + c] * (1 - alpha) + restoredData.data[i + c] * alpha
      )
    }
    out.data[i + 3] = 255
  }

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.putImageData(out, 0, 0)
  return canvasToBlob(canvas)
}

async function localProcess(
  imageBase64: string,
  maskBase64: string | null
): Promise<Blob> {
  const img = await loadImage(`data:image/png;base64,${imageBase64}`)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height

  let mask: HTMLImageElement | null = null
  if (maskBase64) mask = await loadImage(`data:image/png;base64,${maskBase64}`)

  const original = document.createElement('canvas')
  original.width = w
  original.height = h
  const octx = original.getContext('2d')!
  octx.drawImage(img, 0, 0, w, h)
  const originalData = octx.getImageData(0, 0, w, h)

  const blurred = document.createElement('canvas')
  blurred.width = w
  blurred.height = h
  const bctx = blurred.getContext('2d')!
  bctx.filter = 'blur(1.5px)'
  bctx.drawImage(img, 0, 0, w, h)

  const sharpened = document.createElement('canvas')
  sharpened.width = w
  sharpened.height = h
  const sctx = sharpened.getContext('2d')!
  sctx.filter = 'contrast(1.15) saturate(1.2) brightness(1.05)'
  sctx.drawImage(img, 0, 0, w, h)

  const sharpenData = sctx.getImageData(0, 0, w, h)
  const blurData = bctx.getImageData(0, 0, w, h)
  applyUnsharpMask(sharpenData, blurData, 0.6)

  const result = document.createElement('canvas')
  result.width = w
  result.height = h
  const rctx = result.getContext('2d')!

  if (mask) {
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = w
    maskCanvas.height = h
    const mctx = maskCanvas.getContext('2d')!
    mctx.drawImage(mask, 0, 0, w, h)
    const maskData = mctx.getImageData(0, 0, w, h)

    const resultData = rctx.createImageData(w, h)
    for (let i = 0; i < originalData.data.length; i += 4) {
      const alpha = maskData.data[i] / 255
      for (let c = 0; c < 3; c++) {
        resultData.data[i + c] = Math.round(
          originalData.data[i + c] * (1 - alpha) +
            sharpenData.data[i + c] * alpha
        )
      }
      resultData.data[i + 3] = 255
    }
    rctx.putImageData(resultData, 0, 0)
  } else {
    const resultData = rctx.createImageData(w, h)
    for (let i = 0; i < originalData.data.length; i += 4) {
      const e = enhancePixel(
        sharpenData.data[i],
        sharpenData.data[i + 1],
        sharpenData.data[i + 2]
      )
      resultData.data[i] = e.r
      resultData.data[i + 1] = e.g
      resultData.data[i + 2] = e.b
      resultData.data[i + 3] = 255
    }
    rctx.putImageData(resultData, 0, 0)
    rctx.globalAlpha = 0.15
    rctx.drawImage(blurred, 0, 0)
    rctx.globalAlpha = 1
  }

  return canvasToBlob(result)
}

function enhancePixel(r: number, g: number, b: number) {
  const contrast = 1.12
  let nr = (r - 128) * contrast + 128
  let ng = (g - 128) * contrast + 128
  let nb = (b - 128) * contrast + 128

  nr = Math.min(255, nr * 1.03)
  ng = Math.min(255, ng * 1.01)

  const avg = (nr + ng + nb) / 3
  const sat = 1.15
  nr = avg + (nr - avg) * sat
  ng = avg + (ng - avg) * sat
  nb = avg + (nb - avg) * sat

  return {
    r: Math.max(0, Math.min(255, Math.round(nr))),
    g: Math.max(0, Math.min(255, Math.round(ng))),
    b: Math.max(0, Math.min(255, Math.round(nb))),
  }
}

function applyUnsharpMask(
  sharpenData: ImageData,
  blurData: ImageData,
  amount: number
) {
  for (let i = 0; i < sharpenData.data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const sharp = sharpenData.data[i + c]
      const blur = blurData.data[i + c]
      const result = sharp + amount * (sharp - blur)
      sharpenData.data[i + c] = Math.max(0, Math.min(255, Math.round(result)))
    }
  }
}

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

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
