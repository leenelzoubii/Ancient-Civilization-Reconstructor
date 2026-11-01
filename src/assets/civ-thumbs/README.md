# Civilization thumbnails

Drop one real photograph per site in this folder. The site cards pick them up
automatically and stop showing the neutral placeholder.

## File names

Name each file after the site id, using **`.jpg`** (`.jpeg`, `.png` and `.webp`
also work — the card checks them in that order):

| Site                | File name                   |
| ------------------- | --------------------------- |
| Taj Mahal           | `taj-mahal.jpg`             |
| Ancient Egypt       | `egypt.jpg`                 |
| Ancient Rome        | `rome.jpg`                  |
| Maya                | `maya.jpg`                  |
| Khorfakkan          | `khorfakkan.jpg`            |
| Petra               | `petra.jpg`                 |
| Al Jazirat Al Hamra | `al-jazirat-al-hamra.jpg`   |
| Dhayah Fort         | `dhayah-fort.jpg`           |

## Recommended image

- Landscape orientation, about **1200 × 780 px** (the card is 400 : 260).
- A clear daytime photograph of the site itself.
- Keep the file below roughly 400 KB so the page stays fast.

You can add the images one at a time; each card keeps its placeholder until its
own file exists. No code changes are needed. Restart the dev server (or run
`npm run build`) after adding files so the new photos are picked up.
