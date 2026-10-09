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

## Manual image QA (fill in while testing)

Test 10–15 damaged artifact photos (scratches, cracks, missing pieces, stains),
each in **Auto Restore (Experimental)** and **Manual Mask** (paint over damage,
leave some untouched area):

| Photo | Mode | Visible repair? (pass/fail) | Diff score (dev console `[restore]`) | Judge `repaired` | Badge shown | Notes |
|-------|------|------------------------------|--------------------------------------|------------------|-------------|-------|
| | Auto | | | | | |
| | Manual | | | | | |

**Pass criteria**

- Before/after are visibly different; damage is filled in the painted area.
- Unpainted regions are untouched (no global restyle).
- Success → badge `AI Restored` (engine `ai`) or `Local Repair` (engine `local`, amber note explains why).
- Auto failure → **no** Restored pane, no badge, no download; red box shows the real error.
- Failure is honest: never a same-looking image labeled "Restored".

## Expected costs

- `gpt-image-2.5-sunburst` at `medium` 1024² ≈ $0.05 per edit (max 2 edits per restore + judge/describe calls ≈ pennies).
- Budget: $10 prepaid → roughly 100–150 full restores.
