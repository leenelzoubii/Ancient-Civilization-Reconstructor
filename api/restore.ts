import {
  allowRequest,
  checkDailyBudget,
  errorResponse,
  IMAGE_MODEL,
  IMAGE_QUALITY,
  isMockMode,
  MAX_BODY_BYTES,
  readPngInfo,
  recordBilledCall,
  requireKey,
} from './_lib.js'

const OPENAI_EDITS_URL = 'https://api.openai.com/v1/images/edits'

// Client uploads are capped at 1024px on the long side (see prepareFile).
// Anything bigger would only raise the bill, so the server rejects it.
const MAX_LONG_SIDE = 1024

export async function POST(request: Request): Promise<Response> {
  const blocked = allowRequest(request)
  if (blocked) return blocked

  const mock = isMockMode()

  let key: string | null = null
  if (!mock) {
    key = requireKey()
    if (!key) {
      return errorResponse(500, 'OPENAI_API_KEY is not configured on the server.')
    }
    const overBudget = checkDailyBudget()
    if (overBudget) return overBudget
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return errorResponse(
      400,
      'Expected multipart/form-data with image, prompt and optional mask.'
    )
  }

  const prompt = form.get('prompt')
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return errorResponse(400, 'Missing prompt.')
  }
  if (prompt.length > 32000) return errorResponse(400, 'Prompt is too long.')

  const image = form.get('image')
  if (!(image instanceof Blob) || image.size === 0) {
    return errorResponse(400, 'Missing image file.')
  }
  if (image.size > MAX_BODY_BYTES) {
    return errorResponse(
      413,
      `Image too large (limit ${Math.round(MAX_BODY_BYTES / 1_000_000)}MB).`
    )
  }
  if (image.type && image.type !== 'image/png') {
    return errorResponse(400, 'Image must be a PNG.')
  }
  const imageInfo = await readPngInfo(image)
  if (!imageInfo) {
    return errorResponse(400, 'Image must be a valid PNG file.')
  }
  if (Math.max(imageInfo.width, imageInfo.height) > MAX_LONG_SIDE) {
    return errorResponse(
      400,
      `Image too large (${imageInfo.width}x${imageInfo.height}). ` +
        `Long side must be ${MAX_LONG_SIDE}px or less.`
    )
  }

  const mask = form.get('mask')
  if (mask !== null && mask instanceof Blob && mask.size > 0) {
    if (mask.size > MAX_BODY_BYTES) return errorResponse(413, 'Mask too large.')
    if (mask.type && mask.type !== 'image/png') {
      return errorResponse(400, 'Mask must be a PNG.')
    }
    const maskInfo = await readPngInfo(mask)
    if (!maskInfo) {
      return errorResponse(400, 'Mask must be a valid PNG file.')
    }
    if (
      maskInfo.width !== imageInfo.width ||
      maskInfo.height !== imageInfo.height
    ) {
      return errorResponse(
        400,
        `Mask dimensions (${maskInfo.width}x${maskInfo.height}) must exactly ` +
          `match the image (${imageInfo.width}x${imageInfo.height}).`
      )
    }
    // OpenAI edits the fully transparent regions: the mask MUST carry alpha.
    if (maskInfo.colorType !== 4 && maskInfo.colorType !== 6) {
      return errorResponse(
        400,
        'Mask PNG must have an alpha channel (transparent = edit, opaque = keep).'
      )
    }
  }

  if (mock) {
    // $0 path: same validation as production, but the "AI result" is just
    // the input echoed back — no OpenAI call, no key needed, nothing billed.
    // Lets the full client flow (blend, diff, weak-note, badges) run free.
    console.log('[restore] mock edit (no OpenAI call, $0)')
    const bytes = new Uint8Array(await image.arrayBuffer())
    let binary = ''
    const CHUNK = 8192
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + CHUNK)) as number[]
      )
    }
    const b64 = btoa(binary)
    return Response.json(
      {
        created: Math.floor(Date.now() / 1000),
        mock: true,
        data: [{ b64_json: b64 }],
      },
      { headers: { 'x-image-quality': 'mock' } }
    )
  }

  const outbound = new FormData()
  outbound.append('model', IMAGE_MODEL)
  outbound.append('prompt', prompt)
  outbound.append('size', 'auto')
  outbound.append('quality', IMAGE_QUALITY)
  outbound.append('image[]', image, 'image.png')
  if (mask instanceof Blob && mask.size > 0) {
    outbound.append('mask', mask, 'mask.png')
  }

  const res = await fetch(OPENAI_EDITS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: outbound,
  })

  // Pass OpenAI's status and body through unchanged so the client can
  // surface real errors (billing, rate limits, moderation, org verification).
  const body = await res.text()
  if (res.ok) {
    // 2xx = actually billed. Failed requests cost nothing and don't count.
    recordBilledCall()
  } else {
    console.log(
      `[restore] openai error ${res.status}: ${body.slice(0, 200)}`
    )
  }
  return new Response(body, {
    status: res.status,
    headers: {
      'content-type': 'application/json',
      'x-image-quality': IMAGE_QUALITY,
    },
  })
}

export function GET(): Response {
  return errorResponse(405, 'Method not allowed. Use POST.')
}
