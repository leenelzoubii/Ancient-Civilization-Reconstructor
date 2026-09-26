export async function restoreWithMask(
  imageBase64: string,
  maskBase64: string
): Promise<Blob> {
  return processImage(imageBase64, maskBase64)
}

export async function restoreAutomatic(
  imageBase64: string
): Promise<Blob> {
  return processImage(imageBase64, null)
}

async function processImage(
  imageBase64: string,
  maskBase64: string | null
): Promise<Blob> {
  const img = await loadImage(imageBase64)
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height

  // Load mask if provided
  let mask: HTMLImageElement | null = null
  if (maskBase64) {
    mask = await loadImage(maskBase64)
  }

  // Original canvas
  const original = document.createElement('canvas')
  original.width = w
  original.height = h
  const octx = original.getContext('2d')!
  octx.drawImage(img, 0, 0, w, h)
  const originalData = octx.getImageData(0, 0, w, h)

  // Blurred canvas (noise reduction base)
  const blurred = document.createElement('canvas')
  blurred.width = w
  blurred.height = h
  const bctx = blurred.getContext('2d')!
  bctx.filter = 'blur(1.5px)'
  bctx.drawImage(img, 0, 0, w, h)

  // Sharpened canvas (unsharp mask)
  const sharpened = document.createElement('canvas')
  sharpened.width = w
  sharpened.height = h
  const sctx = sharpened.getContext('2d')!
  sctx.filter = 'contrast(1.15) saturate(1.2) brightness(1.05)'
  sctx.drawImage(img, 0, 0, w, h)

  // Apply unsharp mask manually for better sharpening
  const sharpenData = sctx.getImageData(0, 0, w, h)
  const blurData = bctx.getImageData(0, 0, w, h)
  applyUnsharpMask(sharpenData, blurData, 0.6)

  // Result canvas
  const result = document.createElement('canvas')
  result.width = w
  result.height = h
  const rctx = result.getContext('2d')!

  if (mask) {
    // Manual mode: only restore masked (white) areas
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = w
    maskCanvas.height = h
    const mctx = maskCanvas.getContext('2d')!
    mctx.drawImage(mask, 0, 0, w, h)
    const maskData = mctx.getImageData(0, 0, w, h)

    const resultData = rctx.createImageData(w, h)
    for (let i = 0; i < originalData.data.length; i += 4) {
      const maskVal = maskData.data[i] // R channel of mask
      const alpha = maskVal / 255

      if (alpha > 0) {
        // Blend original with restored based on mask
        for (let c = 0; c < 3; c++) {
          resultData.data[i + c] = Math.round(
            originalData.data[i + c] * (1 - alpha) +
              sharpenData.data[i + c] * alpha
          )
        }
        resultData.data[i + 3] = 255
      } else {
        // Keep original
        resultData.data[i] = originalData.data[i]
        resultData.data[i + 1] = originalData.data[i + 1]
        resultData.data[i + 2] = originalData.data[i + 2]
        resultData.data[i + 3] = 255
      }
    }
    rctx.putImageData(resultData, 0, 0)
  } else {
    // Auto mode: restore entire image with enhanced processing
    const resultData = rctx.createImageData(w, h)

    for (let i = 0; i < originalData.data.length; i += 4) {
      const r = sharpenData.data[i]
      const g = sharpenData.data[i + 1]
      const b = sharpenData.data[i + 2]

      // Additional enhancement
      const enhanced = enhancePixel(r, g, b)

      resultData.data[i] = enhanced.r
      resultData.data[i + 1] = enhanced.g
      resultData.data[i + 2] = enhanced.b
      resultData.data[i + 3] = 255
    }

    // Apply slight noise reduction by blending with blurred version
    rctx.putImageData(resultData, 0, 0)
    rctx.globalAlpha = 0.15
    rctx.drawImage(blurred, 0, 0)
    rctx.globalAlpha = 1
  }

  return canvasToBlob(result)
}

function enhancePixel(r: number, g: number, b: number) {
  // Increase contrast
  const contrast = 1.12
  let nr = (r - 128) * contrast + 128
  let ng = (g - 128) * contrast + 128
  let nb = (b - 128) * contrast + 128

  // Boost warm tones slightly (artifact feel)
  nr = Math.min(255, nr * 1.03)
  ng = Math.min(255, ng * 1.01)

  // Increase saturation
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

function loadImage(base64: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = `data:image/png;base64,${base64}`
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
