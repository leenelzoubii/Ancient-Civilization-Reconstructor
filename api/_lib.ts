export const IMAGE_MODEL = 'gpt-image-2.5-sunburst'
export const VISION_MODEL = 'gpt-6-luna'

declare const process: { env: Record<string, string | undefined> }

const configuredQuality = process.env.OPENAI_IMAGE_QUALITY
export const IMAGE_QUALITY =
  configuredQuality === 'low' ||
  configuredQuality === 'medium' ||
  configuredQuality === 'high'
    ? configuredQuality
    : // 'low' is the cheapest documented quality (~$0.01/edit at 1024px);
      // production defaults to 'medium' (~$0.03/edit at 1024px).
      // 'xhigh'/'max' are deliberately NOT whitelisted to cap spend.
      process.env.VERCEL_ENV === 'production'
      ? 'medium'
      : 'low'

export const MAX_BODY_BYTES = 4_000_000
export const RATE_LIMIT_PER_HOUR = 10

// $0 testing switch for local dev. ON only when explicitly enabled AND NOT
// in production, so it can never leak into the live site even if the env var
// is set on the wrong target. Local: OPENAI_MOCK=true in .env or the
// Development environment. Production must never set it.
export function isMockMode(): boolean {
  return (
    process.env.OPENAI_MOCK === 'true' &&
    process.env.VERCEL_ENV !== 'production'
  )
}

// Daily spend guard for billable image calls. In-memory per instance: cheap
// and dependency-free, but resets when the function instance recycles, so a
// production-grade guard should use Upstash Redis or Vercel KV.
const configuredDailyMax = Number(process.env.MAX_CALLS_PER_DAY)
export const MAX_CALLS_PER_DAY =
  Number.isFinite(configuredDailyMax) && configuredDailyMax > 0
    ? Math.floor(configuredDailyMax)
    : 20

const dailyBilledCalls = new Map<string, number>()

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function checkDailyBudget(): Response | null {
  const count = dailyBilledCalls.get(todayKey()) ?? 0
  if (count >= MAX_CALLS_PER_DAY) {
    return errorResponse(
      429,
      `Daily image-edit budget reached (${MAX_CALLS_PER_DAY} billed calls/day). ` +
        `Try again tomorrow.`
    )
  }
  return null
}

// Call ONLY after the image API responds 2xx (failed requests are not
// billed). Logs every billable call with the running daily count.
export function recordBilledCall(): number {
  const key = todayKey()
  if (dailyBilledCalls.size > 60) {
    for (const k of dailyBilledCalls.keys()) {
      if (k !== key) dailyBilledCalls.delete(k)
    }
  }
  const count = (dailyBilledCalls.get(key) ?? 0) + 1
  dailyBilledCalls.set(key, count)
  console.log(
    `[restore] billed image call ${count}/${MAX_CALLS_PER_DAY} today (${key})`
  )
  return count
}

// Minimal PNG header parser (no dependencies): validates the 8-byte
// signature and reads width/height/colorType from IHDR. Lets the server
// reject doomed requests (wrong dims, no alpha, oversized) BEFORE spending.
export type PngInfo = {
  width: number
  height: number
  colorType: number
  bytes: number
}

export async function readPngInfo(blob: Blob): Promise<PngInfo | null> {
  if (blob.size < 33) return null
  const bytes = new Uint8Array(await blob.slice(0, 33).arrayBuffer())
  const sig = [137, 80, 78, 71, 13, 10, 26, 10]
  for (let i = 0; i < 8; i++) if (bytes[i] !== sig[i]) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  if (view.getUint32(8) !== 13) return null
  if (view.getUint32(12) !== 0x49484452) return null // 'IHDR'
  const width = view.getUint32(16)
  const height = view.getUint32(20)
  if (!width || !height) return null
  return { width, height, colorType: bytes[25], bytes: blob.size }
}

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
