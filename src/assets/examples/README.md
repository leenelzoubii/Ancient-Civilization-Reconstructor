# Restorer example photographs

Drop **three damaged-artifact photographs** in this folder — one per
civilization. The repair studio uses them instead of the old drawings.

## File names

| Example        | Civilization | File name    |
| -------------- | ------------ | ------------ |
| Cracked jar    | Ancient Egyptian | `egypt.jpg`  |
| Chipped bowl   | Ancient Roman     | `rome.jpg`   |
| Fractured slab | Maya               | `maya.jpg`   |

`.jpeg`, `.png` and `.webp` also work — the page checks those extensions too.

## What makes a good photo

- **A visible crack, chip or missing piece** — the studio finds it
  automatically and shows the repaired result.
- One artifact per photo, filling most of the frame, on a plain background
  (a table, a sheet of paper, a plain wall).
- Landscape or square, roughly **1200 × 900 px**, under about 400 KB.
- Daylight or even lighting; avoid strong glare on shiny surfaces.

## Credits

After you add the photos, open `src/examples.ts` and fill in the `credit`
line for each example (your name, or the museum and licence if you took it
from a collection). It is printed under each card.

No code changes are needed for the photos themselves: restart the dev server
(or run `npm run build`) after dropping the files in, and the cards pick them
up automatically. Until a photo exists its card stays disabled.
