export const IMAGE_MODEL = 'gpt-image-2.5-sunburst'
export const VISION_MODEL = 'gpt-6-luna'

declare const process: { env: Record<string, string | undefined> }

const configuredQuality = process.env.OPENAI_IMAGE_QUALITY
export const IMAGE_QUALITY =
  configuredQuality === 'low' || configuredQuality === 'high'
    ? configuredQuality
    : 'medium'

export const MAX_BODY_BYTES = 4_000_000
export const RATE_LIMIT_PER_HOUR = 10

const bucket = new Map<string, { count: number; resetAt: number }>()

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

function checkOrigin(request: Request): string | null {
  const origin = request.headers.get('origin')
  if (!origin) return null // non-browser clients (curl); rate limiting still applies
  let host: string
  try {
    host = new URL(origin).host
  } catch {
    return 'Invalid Origin header.'
  }
  if (host.startsWith('localhost') || host.startsWith('127.0.0.1')) return null

  const stripProto = (v: string) => v.replace(/^https?:\/\//, '')
  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? stripProto(process.env.VERCEL_PROJECT_PRODUCTION_URL)
    : null
  const deploymentHost = process.env.VERCEL_URL
    ? stripProto(process.env.VERCEL_URL)
    : null

  if (productionHost && host === productionHost) return null
  if (deploymentHost && host === deploymentHost) return null
  // deployment-specific URLs like tourism-app-next-<hash>.vercel.app
  const slug = productionHost?.split('.')[0]
  if (slug && host.startsWith(`${slug}-`) && host.endsWith('.vercel.app')) {
    return null
  }
  return 'Origin not allowed.'
}

// Best-effort per-instance in-memory rate limiter.
// A production-grade limiter should use Upstash Redis or Vercel KV,
// because this Map resets when the function instance recycles.
export function allowRequest(request: Request): Response | null {
  const originError = checkOrigin(request)
  if (originError) return errorResponse(403, originError)

  const now = Date.now()
  const ip = getClientIp(request)
  let entry = bucket.get(ip)
  if (!entry || entry.resetAt <= now) {
    if (bucket.size > 5000) bucket.clear()
    entry = { count: 0, resetAt: now + 60 * 60 * 1000 }
    bucket.set(ip, entry)
  }
  entry.count += 1
  if (entry.count > RATE_LIMIT_PER_HOUR) {
    return errorResponse(
      429,
      `Rate limit exceeded: ${RATE_LIMIT_PER_HOUR} requests per hour. Try again later.`
    )
  }
  return null
}

export function requireKey(): string | null {
  return process.env.OPENAI_API_KEY || null
}

export function errorResponse(status: number, message: string): Response {
  return Response.json({ error: { message } }, { status })
}
