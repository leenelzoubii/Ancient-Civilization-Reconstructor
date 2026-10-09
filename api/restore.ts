import {
  allowRequest,
  errorResponse,
  IMAGE_MODEL,
  IMAGE_QUALITY,
  MAX_BODY_BYTES,
  requireKey,
} from './_lib'

const OPENAI_EDITS_URL = 'https://api.openai.com/v1/images/edits'

export async function POST(request: Request): Promise<Response> {
  const blocked = allowRequest(request)
  if (blocked) return blocked

  const key = requireKey()
  if (!key) {
    return errorResponse(500, 'OPENAI_API_KEY is not configured on the server.')
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

  const mask = form.get('mask')
  if (mask !== null && mask instanceof Blob && mask.size > 0) {
    if (mask.size > MAX_BODY_BYTES) return errorResponse(413, 'Mask too large.')
    if (mask.type && mask.type !== 'image/png') {
      return errorResponse(400, 'Mask must be a PNG.')
    }
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
  return new Response(body, {
    status: res.status,
    headers: { 'content-type': 'application/json' },
  })
}

export function GET(): Response {
  return errorResponse(405, 'Method not allowed. Use POST.')
}
