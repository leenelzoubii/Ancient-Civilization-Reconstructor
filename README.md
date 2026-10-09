# ACR — Ancient Civilization Reconstructor

A Vite + React + TypeScript web application exploring 8 ancient civilizations with interactive 3D photogrammetry models, YouTube videos, structured historical content, flashcard quizzes, and AI-powered artifact restoration.

## Features

- **8 Civilizations**: Ancient Egypt, Ancient Rome, Maya, Taj Mahal, Petra, Khor Fakkan Portuguese Fort, Al-Jazirat Al-Hamra, Dhayah Fort
- **Light / Dark Mode**: Theme toggle with CSS-variable-driven colors, persisted in `localStorage`
- **3D Photogrammetry**: Sketchfab embeds for each civilization
- **YouTube Integration**: Historical video per civilization
- **Tabbed Content**: Overview, History, Architecture, Culture, Economy, Society & Daily Life, Achievements
- **Flashcard Quizzes**: 4 questions per civilization with show-answer, navigation, and score tracking
- **AI Artifact Restorer**: Upload a damaged artifact photo — restores it via Pollinations FLUX image editing, with a local Canvas enhancement fallback
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
├── index.html            # Entry HTML (title, fonts, no-flash theme script)
├── public/
│   └── favicon.svg       # ACR logo
├── data/
│   ├── civilizations.json  # Structured content per civilization
│   └── quizzes.json        # Flashcard questions per civilization
├── src/
│   ├── App.tsx           # Routing, NavBar, Home, Detail pages, theme state
│   ├── index.css         # Tailwind + light/dark theme variables
│   ├── components/
│   │   ├── VisualScene.tsx      # Global + UAE desert homepage scenes
│   │   ├── AnimatedSection.tsx  # Scroll-reveal wrapper
│   │   └── CustomCursor.tsx
│   ├── pages/
│   │   ├── ArtifactRestorer.tsx # AI restoration UI
│   │   └── AboutPage.tsx
│   └── services/
│       └── restoreService.ts # Restore flow: /api/restore + local mask in-paint
├── api/
│   ├── _lib.ts          # Shared guards (rate limit, origin, validation)
│   ├── restore.ts       # Proxies image edits to OpenAI (key stays server-side)
│   └── vision.ts        # Damage describe + result judge (gpt-6-luna)
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

`.env` (not committed) — server-side only, **never** `VITE_`-prefixed:

```
OPENAI_API_KEY=sk-...        # used by /api/* functions (local `vercel dev`)
# OPENAI_IMAGE_QUALITY=medium  # optional: low | medium | high
```

In production the same value lives in Vercel → Settings → Environment Variables.

## Git Workflow

- Work on feature branches (`feature/<name>`), then merge into `main` after testing
- Commit often with descriptive messages; push to GitHub regularly

## Deployment

- **Frontend**: Vercel (static + `/api` Vercel Functions)
- **Backend**: none — AI calls go through `/api/*` serverless functions (key stays server-side)
