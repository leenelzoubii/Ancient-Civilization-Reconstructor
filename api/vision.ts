import {
  allowRequest,
  errorResponse,
  isMockMode,
  MAX_BODY_BYTES,
  requireKey,
  VISION_MODEL,
} from './_lib.js'

const CHAT_URL = 'https://api.openai.com/v1/chat/completions'

const DESCRIBE_PROMPT =
  'List every visible crack, chip, scratch, stain and missing fragment on this ' +
  'ancient artifact and where each is located (e.g. "hairline crack from rim to ' +
  'handle", "chipped lower-left base"). Reply in at most 3 sentences. Do not ' +
  'describe anything that is intact.'

const JUDGE_PROMPT =
  'Compare these two photos of an ancient artifact (first is before, second is ' +
  'after). Are all cracks, chips and missing pieces gone in the second image, ' +
  'and is the artifact otherwise unchanged in shape, color and background? ' +
  'Reply ONLY with JSON.'

// The civilizations the client knows about. The model must pick from this
// list so the browser can map the answer back to its own data.
const CIV_NAMES = [
  'Ancient Egypt',
  'Ancient Rome',
  'Maya Civilization',
  'Taj Mahal',
  'Petra',
  'Khor Fakkan Portuguese Fort',
  'Al-Jazirat Al-Hamra Courtyard Complex',
  'Dhayah Fort at Ras-Al Khaimah, UAE',
]

const CLASSIFY_PROMPT =
  'You are an archaeologist identifying an ancient artifact from a photograph. ' +
  'Choose the civilization it most likely belongs to from this list only: ' +
  CIV_NAMES.join('; ') +
  '. Rank the top 3 civilizations by probability (0-100, the three values must ' +
  'sum to 100 or less). Give exactly 3 short reasons (max 14 words each) that ' +
  'cite the artifact\'s colour, shape or decoration. Set confidence (0-100) for ' +
  'the top match. Reply ONLY with JSON.'

const JUDGE_SCHEMA = {
  name: 'restoration_judge',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      repaired: { type: ['boolean', 'null'] },
      unchanged_elsewhere: { type: ['boolean', 'null'] },
      remaining_damage: { type: 'string' },
    },
    required: ['repaired', 'unchanged_elsewhere', 'remaining_damage'],
    additionalProperties: false,
  },
}

const CLASSIFY_SCHEMA = {
  name: 'artifact_classification',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      civilizations: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', enum: CIV_NAMES },
            probability: { type: 'number' },
          },
          required: ['name', 'probability'],
          additionalProperties: false,
        },
      },
      reasons: {
        type: 'array',
        minItems: 3,
        maxItems: 3,
        items: { type: 'string' },
      },
      confidence: { type: 'number' },
    },
    required: ['civilizations', 'reasons', 'confidence'],
    additionalProperties: false,
  },
}

const MOCK_CLASSIFICATION = {
  civilizations: [
    { name: 'Maya Civilization', probability: 78 },
    { name: 'Ancient Egypt', probability: 14 },
    { name: 'Ancient Rome', probability: 8 },
  ],
  reasons: [
    'Warm terracotta slip typical of Maya polychrome pottery',
    'Straight, cylindrical sides like Maya cylinder vases',
    'Deep red painted bands around the middle of the vessel',
  ],
  confidence: 66,
}

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
  }

  const raw = await request.text().catch(() => '')
  if (!raw) return errorResponse(400, 'Expected a JSON body.')
  if (raw.length > MAX_BODY_BYTES) return errorResponse(413, 'Body too large.')

  let payload: { mode?: unknown; images?: unknown }
  try {
    payload = JSON.parse(raw)
  } catch {
    return errorResponse(400, 'Invalid JSON body.')
  }

  const mode = payload.mode
  const images = payload.images
  if (mode !== 'describe' && mode !== 'judge' && mode !== 'classify') {
    return errorResponse(400, 'mode must be "describe", "judge" or "classify".')
  }
  if (
    !Array.isArray(images) ||
    !images.every(
      (i: unknown) => typeof i === 'string' && i.startsWith('data:image/')
    )
  ) {
    return errorResponse(400, 'images must be an array of data URLs.')
  }
  const expected = mode === 'judge' ? 2 : 1
  if (images.length !== expected) {
    return errorResponse(400, `mode "${mode}" requires ${expected} image(s).`)
  }

  if (mock) {
    // $0 path: canned answers, no OpenAI call, no key needed.
    console.log(`[vision] mock ${mode} (no OpenAI call, $0)`)
    if (mode === 'describe') {
      return Response.json({
        mock: true,
        text: 'Mock damage description: a thin crack runs across the middle (mock, no OpenAI call).',
      })
    }
    if (mode === 'classify') {
      return Response.json({ mock: true, classification: MOCK_CLASSIFICATION })
    }
    return Response.json({
      mock: true,
      judge: {
        repaired: true,
        unchanged_elsewhere: true,
        remaining_damage: 'none (mock)',
      },
    })
  }

  const prompt =
    mode === 'describe' ? DESCRIBE_PROMPT : mode === 'judge' ? JUDGE_PROMPT : CLASSIFY_PROMPT

  const content = [
    { type: 'text', text: prompt },
    ...images.map(url => ({ type: 'image_url', image_url: { url } })),
  ]

  const body: Record<string, unknown> = {
    model: VISION_MODEL,
    messages: [{ role: 'user', content }],
    reasoning_effort: 'low',
    max_completion_tokens: 1500,
  }
  if (mode === 'judge') {
    body.response_format = { type: 'json_schema', json_schema: JUDGE_SCHEMA }
  }
  if (mode === 'classify') {
    body.response_format = { type: 'json_schema', json_schema: CLASSIFY_SCHEMA }
  }

  const res = await fetch(CHAT_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${key ?? ''}`,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  if (!res.ok) {
    return new Response(text, {
      status: res.status,
      headers: { 'content-type': 'application/json' },
    })
  }

  let parsed: {
    choices?: { message?: { content?: string | null } }[]
  }
  try {
    parsed = JSON.parse(text)
  } catch {
    return errorResponse(502, 'Vision API returned invalid JSON.')
  }
  const contentText = parsed.choices?.[0]?.message?.content ?? ''

  if (mode === 'describe') {
    return Response.json({ text: contentText })
  }

  // Judge/classify: parse defensively (strip code fences); on failure return
  // null so the caller can fall back to its local heuristics.
  let json: unknown = null
  try {
    const cleaned = contentText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
    json = JSON.parse(cleaned)
  } catch {
    json = null
  }
  if (mode === 'judge') return Response.json({ judge: json })
  return Response.json({ classification: json })
}

export function GET(): Response {
  return errorResponse(405, 'Method not allowed. Use POST.')
}
