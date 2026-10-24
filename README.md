# ACR — Ancient Civilization Reconstructor

A Vite + React + TypeScript web application exploring 8 historical sites — from Ancient Egypt, Rome and the Maya to the UAE's Khor Fakkan Fort, Al-Jazirat Al-Hamra and Dhayah Fort — with interactive 3D photogrammetry models, YouTube videos, structured historical content, flashcard quizzes, and AI-powered artifact restoration.

## Features

- **8 Historical Sites**: Ancient Egypt, Ancient Rome, Maya, Taj Mahal, Petra, Khor Fakkan Portuguese Fort, Al-Jazirat Al-Hamra, Dhayah Fort
- **Scene Illustration Banners**: each detail page opens with a banner-sized panoramic SVG scene (900×140, `preserveAspectRatio="slice"` full-bleed fill), ported from the legacy site's `illustrations.js` into `src/illustrations.ts`
- **Light / Dark Mode**: Theme toggle with CSS-variable-driven colors, persisted in `localStorage`
- **3D Photogrammetry**: Sketchfab embeds for each civilization (homepage features Earth 16K)
- **YouTube Integration**: Historical video per civilization
- **Tabbed Content**: Overview, History, Architecture, Culture, Economy, Society & Daily Life, Achievements, Flashcards — with Prev/Next buttons to step through every section
- **Flashcard Quizzes**: 4 multiple-choice questions per civilization with instant right/wrong feedback, question dots, navigation, and score tracking
- **AI Artifact Restorer**: Paint over damage on an uploaded photo; server-side OpenAI edit (`gpt-image-2.5-sunburst`) rebuilds only the painted area. Spend-safe by design: mock mode for $0 testing, one click = at most one billable call (no auto-retry), cost confirmation before every paid call, HTTP 200 results always shown, daily server-side cap on billed calls
- **Legacy Sub-Site**: the original vanilla HTML/CSS/JS build preserved byte-for-byte at `/legacy/` (excluded from the bundle via `@source not`)
- **Smooth Animations**: CSS keyframe animations (fade-in, float, drift, pulse-glow)
- **Responsive Design**: Mobile, tablet, desktop

## Civilizations

| ID | Name |
|----|------|
| egypt | Ancient Egypt |
| rome | Ancient Rome |
| maya | Maya Civilization |
| taj-mahal | Taj Mahal |
| petra | Petra |
| khorfakkan | Khor Fakkan Portuguese Fort |
| al-jazirat-al-hamra | Al-Jazirat Al-Hamra Courtyard Complex |
| dhayah-fort | Dhayah Fort |

## Architecture

```
tourism-app-next/
├── index.html            # Entry HTML (title, fonts, favicon, no-flash theme script)
├── public/
│   ├── logo/             # Brand assets: logo-light.png, logo-banner.jpg, favicons
│   └── legacy/           # Original vanilla site, served intact at /legacy/
│       ├── index.html
│       ├── css/styles.css
│       ├── js/           # app, data, engine3d, scenes, illustrations, vr, reconstruct
│       └── assets/       # ACR marks + favicons (byte-identical to originals)
├── data/
│   ├── civilizations.json  # Structured content per civilization
│   └── quizzes.json        # Flashcard questions per civilization
├── src/
│   ├── App.tsx           # Routing, NavBar, Home, Detail pages (banner slot), theme state
│   ├── illustrations.ts  # Panoramic 900×140 SVG scene banners for all 8 sites
│   ├── index.css         # Tailwind + light/dark theme variables + .civ-banner sizing
│   ├── components/
│   │   ├── VisualScene.tsx      # Global + UAE desert homepage scenes
│   │   ├── AnimatedSection.tsx  # Scroll-reveal wrapper
│   │   ├── Flashcards.tsx       # MCQ quiz UI (larger text, dots, score)
│   │   └── CustomCursor.tsx
│   ├── pages/
│   │   ├── ArtifactRestorer.tsx # Manual-mask restore UI (confirm, spend meter, Try again)
│   │   └── AboutPage.tsx
│   └── services/
│       └── restoreService.ts # Single-call restore flow: pre-flight, mock, blend, verify
├── api/
│   ├── _lib.ts          # Shared guards (rate limit, daily budget, mock flag, PNG checks)
│   ├── restore.ts       # Proxies image edits to OpenAI (key stays server-side)
│   └── vision.ts        # Damage describe + result judge (gpt-6-luna, opt-in)
├── TESTING.md          # Mock + manual QA checklist, cost figures
└── vite.config.ts
```

## Running

```bash
npm install
npm run dev      # frontend only: http://localhost:5176 (no /api)
npx vercel dev   # frontend + /api together (needed to test the restorer)
npm run build    # typecheck + production build
```

## Environment

`.env` (not committed) — server-side only, **never** `VITE_`-prefixed keys:

```
OPENAI_API_KEY=sk-...        # used by /api/* functions (local `vercel dev`)
OPENAI_MOCK=true             # dev only: /api/* return canned $0 answers, no OpenAI calls
# OPENAI_IMAGE_QUALITY=medium  # optional: low | medium | high (dev defaults low, prod medium)
# MAX_CALLS_PER_DAY=20         # optional daily cap on billed image calls
```

Client flags (safe `VITE_` toggles, not secrets — set in `.env.local` or shell):

```
# VITE_MOCK_AI=false    # force the real HTTP stack in dev (still $0 if OPENAI_MOCK=true)
# VITE_VISION_LAYER=true  # opt in to the judge call (default off; annotates only)
```

In production the key lives in Vercel → Settings → Environment Variables.
**Never set `OPENAI_MOCK=true` on Production** (the code also refuses to
mock when `VERCEL_ENV=production`).

Spend rules: one click = at most one billable image call (no auto-retry;
"Try again" is the only retry), HTTP 200 results are always shown, and the
server caps billed image calls per day (`MAX_CALLS_PER_DAY`, in-memory —
use Upstash/KV for a production-grade guard).

## Git Workflow

- Work directly on `main`; commit with descriptive messages and push to GitHub regularly
- Ship with `npx vercel deploy --prod --yes` after a green `npm run build`

## Deployment

- **Frontend**: Vercel (static + `/api` Vercel Functions) — https://tourism-app-next.vercel.app
- **Repository**: https://github.com/leenelzoubii/Ancient-Civilization-Reconstructor
- **Backend**: none — AI calls go through `/api/*` serverless functions (key stays server-side)

## Credits

ACR was built by:

- Mahrah Alyammahi
- Afra Al Hamed
- Hajar Alsaqqaf
- Salama Alhadhrami

Educational & research project. 3D models are property of their respective creators on Sketchfab.
