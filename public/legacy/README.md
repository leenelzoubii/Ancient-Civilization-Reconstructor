# Ancient Civilization Reconstructor

An interactive educational website for exploring **Ancient Egypt**, **Ancient Rome** and **the Maya** through 3D reconstructions, with an **AI Artifact Reconstruction** feature that estimates how a broken artifact originally looked.

Computing and Artificial Intelligence Cluster — Capstone Project
Applied Technology Schools, Baniyas Girls campus · Supervisor: Ms. Ashjan Saleh

Team: Mahrah Ahmed Hassan Saeed Alyammahi · Afraa Mohammed Alawi Hadi Al Hamed · Hajar Hashim Mohamed Sharif Alsaqqaf · Salama Ali Saeed Kardous Alhadhrami

---

## How to run

1. Unzip the folder.
2. Double-click **`index.html`** (opens in Chrome, Edge, Firefox or Safari).

No installation, server or internet connection is needed. (With internet, the site also loads its web fonts.)

To open it from Visual Studio Code, you can also use the *Live Server* extension → right-click `index.html` → *Open with Live Server*.

## Pages (matching the wireframes)

| # | Page | Address |
|---|------|---------|
| 1 | Home | `#/` |
| 2 | Civilization Selection | `#/civilizations` |
| 3 | Reconstruction View (interactive 3D) | `#/civ/egypt`, `#/civ/rome`, `#/civ/maya` |
| 4 | Information Page | `#/civ/egypt/info/history` (overview, history, architecture, dailylife, achievements) |
| 5 | AI Artifact Reconstruction | `#/reconstruct` |
| 6 | Reconstruction Result | `#/reconstruct/result` |
| – | About the project | `#/about` |

## Features

- **3D reconstructions** of Giza and the Nile, Imperial Rome (Colosseum, temple, arch, aqueduct, insulae) and Chichén Itzá (El Castillo, ball court, cenote). Drag to rotate, scroll/pinch to zoom, Shift+drag to pan; numbered landmarks fly the camera to each monument; auto-rotate, screenshot and full-screen buttons.
- **Educational content** for each civilization: overview, history, architecture, daily life, achievements, timelines and key facts.
- **AI Artifact Reconstruction**: upload (or drag, drop or paste) a photo of a broken artifact, add optional reference images, and get an estimated complete artifact with before/after comparison slider, highlighted restored areas, **predicted civilization with match % and reasons**, confidence score, colour palette, download and a saved gallery. Three sample broken artifacts are built in for demos.
- **Site search**, **session saving** (remembers the last civilization and visited pages), responsive layout for phones and tablets, keyboard navigation.

## Virtual reality (VR)

On any 3D page, click **Enter VR** (or the headset button on the viewer) and choose:

| Mode | Device | How to use |
|------|--------|-----------|
| **VR headset** | Meta Quest, Pico and other WebXR headsets | Open the website in the headset's browser. Trigger = next landmark, left trigger = previous, grip = show/hide info panel, left stick = walk, right stick = turn. |
| **Phone VR viewer** | Phone + Google Cardboard-style viewer | Split-screen view. Turn your head to look around (motion sensors), tap the screen to go to the next landmark. |
| **Walk-in view** | Any computer, tablet or phone | Full-screen first-person view. Drag to look, W A S D to walk, ← → to change landmark, I to hide the info panel. |

You stand at eye level, at real-world scale, beside each landmark, with a floating panel showing its information.

**Important:** VR headsets and phone motion sensors only work when the website is opened from a secure **https** address. The easiest free option is **GitHub Pages**: upload the folder to a GitHub repository, then Settings → Pages → deploy from the main branch. The walk-in view works anywhere, even when opening `index.html` directly.

## How the AI reconstruction works

All processing runs in the browser (`js/reconstruct.js`); photos are never uploaded.

1. **Normalise** – resize the photo and add a margin.
2. **Segment** – estimate the background colour from the image border, pick a threshold with Otsu's method, and grow the artifact region (hysteresis) so pale highlights are kept.
3. **Find the symmetry axis** – each row's left/right edge midpoint is collected; undamaged rows agree on the true centre, so the most common midpoint is the axis.
4. **Rebuild the outline** – mirror the artifact across the axis and close small notches in the profile, while keeping real openings such as handle loops.
5. **Restore the surface** – copy each missing pixel from its mirror position; any remaining gaps are inpainted by growing colour inward from the edges.
6. **Use reference images** – a k-means colour palette is learned from the references and blended into inferred areas.
7. **Blend and report** – seams are smoothed, and the result reports how much was restored, the symmetry match and an estimated confidence.
8. **Predict the civilization** – the reconstructed artifact's colours (terracotta, black, blue, cream, deep red) and shape (height/width ratio, neck width, widest point, straight sides, handles) are compared with typical pottery of Egypt, Rome and the Maya. Each matching trait adds weighted evidence, the scores are turned into percentages, and the page shows the most likely civilization, the match % for all three, and the reasons.

**Best results:** photograph the object straight on, upright, against a plain contrasting background. Works best for symmetrical objects (pots, vases, jars, columns). Results are educational estimates, not archaeological fact.

## Project structure

```
index.html            Page shell, header, footer
css/styles.css        All styling (responsive)
js/engine3d.js        WebGL 3D engine: geometry, lighting, fog, camera orbit controls
js/scenes.js          The three 3D scenes and their landmarks
js/data.js            Historical content for each civilization
js/illustrations.js   Vector illustrations for cards and pages
js/vr.js              VR headset (WebXR), phone VR viewer and walk-in modes
js/reconstruct.js     AI artifact reconstruction pipeline + sample artifacts
js/app.js             Pages, routing, search, session saving
assets/logo.svg       Logo / favicon
```

## Note on Three.js

The project plan lists Three.js. The 3D viewer here uses a small built-in WebGL engine (`js/engine3d.js`) instead, so the website works offline with no downloads. It follows the same ideas as Three.js (scene, mesh geometry, camera, lights, fog, orbit controls). The scenes in `js/scenes.js` can be ported to Three.js later, or models made in Blender can be added, if required.
