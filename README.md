# Ancient Civilization Reconstructor

A Next.js 16 web application exploring ancient civilizations with 3D reconstructions, YouTube videos, and SSE streaming.

## Live Demo

**Frontend**: http://localhost:5173  
**Backend API**: http://localhost:8000

## Features

- **7 Civilizations**: Ancient Egypt, Ancient Rome, Maya, Khor Fakkan Portuguese Fort, Petra, Al-Jazirat Al-Hamra, Dhayah Fort
- **SSE Streaming**: Real-time civilization data stream via FastAPI
- **3D/Visual Reconstruction**: Sketchfab embeds for each civilization
- **YouTube Integration**: Historical videos per civilization
- **Tabbed Content System**: Overview/History/Architecture/Daily Life/Achievements
- **Smooth Animations**: CSS keyframe animations (fade-in, float, pulse-glow)
- **Responsive Design**: Works mobile, tablet, desktop

## Civilizations

| ID | Name |
|----|------|
| egypt | Ancient Egypt |
| rome | Ancient Rome |
| maya | Maya Civilization |
| khorfakkan | Khor Fakkan Portuguese Fort |
| petra | Petra |
| al-jazirat-al-hamra | Al-Jazirat Al-Hamra Courtyard |
| dhayah-fort | Dhayah Fort |

## Architecture

```
Ancient Civilization Reconstructor/
├── app/              # Next.js 16 App Router
│   ├── page.tsx      # Home page
│   └── civilization/[civId]/page.tsx  # Reconstruction view
├── components/       # React components
│   ├── CivilizationGrid.tsx
│   ├── ReconstructionView.tsx
│   └── SSECivilizationsStream.tsx
├── data/             # JSON data
│   └── civilizations.json
├── css/              # Custom animations
│   └── animations.css
├── components/       # React components
└── server/           # FastAPI backend
    └── main.py       # SSE endpoints
```

## Running

```bash
# Frontend (Next.js)
cd tourism-app-next
npm run dev     # http://localhost:5173

# Backend (FastAPI with SSE)
cd tourism-app-backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

## SSE Endpoints

- `GET /sse/civilizations` - Stream civilization data
- `POST /sse/artifact-reconstruct` - Artifact reconstruction progress
- `GET /health` - Health check