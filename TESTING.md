# Testing — Artifact Restorer (OpenAI serverless)

## Automated function tests (verified 2026-10-09, `npx vercel dev`)

| # | Request | Expected | Result |
|---|---------|----------|--------|
| T1 | `GET /api/restore` | 405 | ✅ 405 |
| T2 | POST with `Origin: https://evil.example.com` | 403 | ✅ 403 |
| T3 | POST image part with `type=image/jpeg` | 400 `Image must be a PNG.` | ✅ 400 |
| T4 | POST image without `prompt` | 400 `Missing prompt.` | ✅ 400 |
| T5 | `POST /api/vision` with multipart instead of JSON | 400 | ✅ 400 |
| T6 | `POST /api/restore` real PNG, real prompt | 200 + `b64_json` PNG | ✅ 200 (1.5 MB response) |
| T7 | `POST /api/vision` `mode:"describe"` | 200 `{text}` | ✅ 200, sensible caption |
| T8 | `POST /api/vision` `mode:"judge"` (identical images) | 200 `{judge}` | ✅ 200, `repaired:false` |
| T9 | 11th request within an hour | 429 with limit message | ✅ verified against `allowRequest` module (dev gives each invocation a fresh module, so the in-memory bucket only trips in warm instances) |

Bundle check: `dist/` contains no `sk-` strings and no old `VITE_` key names.

## Production (live, tourism-app-next.vercel.app — 2026-10-09)

| Check | Result |
|-------|--------|
| Site loads | ✅ 200 |
| `GET /api/restore` | ✅ 405 |
| Evil `Origin` header | ✅ 403 |
| Missing `prompt` | ✅ 400 |
| Real restore (`gpt-image-2.5-sunburst`, Production Secret) | ✅ 200, 1.49 MB `b64_json` PNG |
| `vision describe` (`gpt-6-luna`) | ✅ 200, accurate caption |
| `vision judge` (identical pair) | ✅ 200, `repaired:false` |

Note: `vercel dev` runs each function invocation in a fresh module, so the
in-memory rate limiter only trips on warm instances (i.e. in production); its
logic is unit-verified above. Upgrade to Upstash/KV if per-instance limits are
not acceptable.

## Spend-guard verification (2026-10-09, $0 spent)

Server mock (`OPENAI_MOCK=true`, dev key **removed** so no OpenAI call is
even possible), via `npx vercel dev`:

| # | Request | Expected | Result |
|---|---------|----------|--------|
| M1 | POST restore, valid PNG + prompt, no key configured | 200 `mock:true`, `x-image-quality: mock` | ✅ 200, echo body |
| M2 | Same + matching-alpha mask | 200 `mock:true` | ✅ 200 |
| M3 | Mask 64x64 vs image 96x96 | 400 dims message | ✅ 400 |
| M4 | Image part `type=image/jpeg` | 400 | ✅ 400 |
| M5 | 5 MB body | 413 | ✅ 413 |
| M6 | 1200x800 PNG | 400 long-side message | ✅ 400 |
| M7 | `vision describe` | 200 canned text + `mock:true` | ✅ 200 |
| M8 | `vision judge` (2 images) | 200 canned judge + `mock:true` | ✅ 200 |
| M9 | Daily budget (module unit test) | 20 billed → 21st 429; `MAX_CALLS_PER_DAY=3` → 4th 429 | ✅ both, with per-call server log |

Client mock (`DEV_MOCK_AI`, default in dev builds): full UI flow runs with
zero network calls — `callRestore` throws if ever reached in mock mode.
Browser checklist (dev server, paint a crack, Restore → Continue):
`Mock mode` pill visible · session spend stays `$0.000` · confirm panel
shows painted % · result shows blended image + `AI Restored` + `Mock` badges
· judge runs only with `VITE_VISION_LAYER=true`.

## Manual image QA (fill in while testing, production key)

Test 10–15 damaged artifact photos (scratches, cracks, missing pieces, stains),
each painted with the Manual Mask (leave some area untouched):

| Photo | Visible repair? (pass/fail) | Diff score (dev console `[restore]`) | Judge `repaired` | Badge shown | Notes |
|-------|------------------------------|--------------------------------------|------------------|-------------|-------|
| | | | | | |

**Pass criteria**

- Confirm panel states the credit cost before any paid call; >15% painted
  area requires the ack checkbox.
- Before/after are visibly different; damage is filled in the painted area.
- Unpainted regions are untouched (no global restyle).
- A 200 AI result is ALWAYS shown; weak ones carry an amber
  "may be weak, please inspect" note instead of being replaced.
- Success → badge `AI Restored`, or `Local Repair (basic)` only when the AI
  call itself failed on a <5% area (amber note shows the real error).
- Failure → **no** Restored pane, no badge, no download; red box shows the
  real error. "Try again" is the only retry (another paid call, confirmed).
- Failure is honest: never a same-looking image labeled "Restored".
- Detail pages: Prev/Next buttons at the bottom of the content panel step
  through all tabs (Overview → … → Flashcards) and scroll back to the tab bar.

## Expected costs (Oct 2026 calculator, 1024px, rounded up incl. inputs)

- `low` ~$0.02/edit (dev default), `medium` ~$0.03/edit (prod default),
  `high` ~$0.06/edit. Output-only figures: low $0.0059, medium $0.0132.
- Judge call (opt-in) ~$0.001.
- Guards: 1 paid image call per restore max, 10 req/hour rate limit,
  20 billed image calls/day server cap, explicit cost confirmation per call.
- Budget: $10 prepaid → roughly 300+ medium restores if every call billed.
