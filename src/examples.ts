/**
 * Three damaged artifacts made for the repair studio demo.
 *
 * They are inline SVGs so they ship with the app, need no network request and
 * can be turned into a PNG file in the browser. Every example has a plain
 * background and thin dark cracks so the local detector has something real to
 * find when the user does not have a photo of their own.
 */

export type ExampleArtifact = {
  id: string
  name: string
  origin: string
  note: string
  svg: string
}

const jar = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 700" role="img" aria-label="Cracked clay jar">
  <rect width="900" height="700" fill="#f4ead4"/>
  <circle cx="722" cy="128" r="112" fill="#fff8ea" opacity=".65"/>
  <ellipse cx="450" cy="612" rx="214" ry="26" fill="#7a5a32" opacity=".15"/>
  <path d="M372 196h156l-10 62c58 44 88 108 88 180 0 104-62 156-156 156s-156-52-156-156c0-72 30-136 88-180z" fill="#c98b4a"/>
  <path d="M372 196h156l-10 62c58 44 88 108 88 180 0 104-62 156-156 156s-156-52-156-156c0-72 30-136 88-180z" fill="none" stroke="#8a5330" stroke-width="7"/>
  <ellipse cx="450" cy="196" rx="78" ry="22" fill="#e0a86a" stroke="#8a5330" stroke-width="7"/>
  <ellipse cx="450" cy="196" rx="52" ry="13" fill="#7a4526"/>
  <path d="M330 300c70 18 170 18 240 0" fill="none" stroke="#8a5330" stroke-width="6" opacity=".65"/>
  <path d="M314 420c86 22 186 22 272 0" fill="none" stroke="#8a5330" stroke-width="6" opacity=".65"/>
  <path d="M470 198l-14 58 20 46-26 62 18 54-10 50" fill="none" stroke="#3b2417" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M456 256l-38 34 6 30" fill="none" stroke="#3b2417" stroke-width="5" stroke-linecap="round"/>
  <path d="M384 210c-14 6-22 18-18 32 12 8 28 4 36-6z" fill="#f4ead4" stroke="#3b2417" stroke-width="4" stroke-linejoin="round"/>
</svg>`

const bowl = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 700" role="img" aria-label="Chipped stone bowl">
  <rect width="900" height="700" fill="#f3e8d6"/>
  <circle cx="188" cy="132" r="104" fill="#fdf4e4" opacity=".7"/>
  <ellipse cx="450" cy="556" rx="238" ry="28" fill="#7c3a1f" opacity=".14"/>
  <path d="M204 330c152-46 340-46 492 0-16 146-124 222-246 222S220 476 204 330z" fill="#b5623a"/>
  <path d="M204 330c152-46 340-46 492 0-16 146-124 222-246 222S220 476 204 330z" fill="none" stroke="#7c3a1f" stroke-width="7"/>
  <ellipse cx="450" cy="330" rx="246" ry="48" fill="#c97a4e" stroke="#7c3a1f" stroke-width="7"/>
  <ellipse cx="450" cy="330" rx="196" ry="34" fill="#6f3a25"/>
  <path d="M258 400c118 34 266 34 384 0" fill="none" stroke="#7c3a1f" stroke-width="6" opacity=".6"/>
  <path d="M392 306l-26 52 18 44-22 56 12 44" fill="none" stroke="#3b2417" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M366 358l-42 16M384 402l34 18" fill="none" stroke="#3b2417" stroke-width="5" stroke-linecap="round"/>
  <path d="M636 312c16 8 22 26 12 40-18 6-34-4-38-20z" fill="#f3e8d6" stroke="#3b2417" stroke-width="4" stroke-linejoin="round"/>
</svg>`

const tablet = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 700" role="img" aria-label="Fractured stone tablet">
  <rect width="900" height="700" fill="#f4ead4"/>
  <circle cx="716" cy="142" r="108" fill="#fff8ea" opacity=".6"/>
  <ellipse cx="450" cy="614" rx="196" ry="24" fill="#7a5a32" opacity=".15"/>
  <rect x="298" y="128" width="304" height="448" rx="20" fill="#d8b878"/>
  <rect x="298" y="128" width="304" height="448" rx="20" fill="none" stroke="#8a6a3c" stroke-width="7"/>
  <rect x="322" y="152" width="256" height="400" rx="12" fill="none" stroke="#a98a5c" stroke-width="4" opacity=".7"/>
  <g fill="#a98a5c" opacity=".75">
    <rect x="352" y="196" width="34" height="30" rx="4"/>
    <circle cx="424" cy="211" r="15"/>
    <rect x="462" y="196" width="42" height="30" rx="4"/>
    <rect x="530" y="196" width="26" height="30" rx="4"/>
    <rect x="352" y="262" width="26" height="30" rx="4"/>
    <rect x="398" y="262" width="40" height="30" rx="4"/>
    <circle cx="482" cy="277" r="15"/>
    <rect x="520" y="262" width="36" height="30" rx="4"/>
    <rect x="352" y="328" width="40" height="30" rx="4"/>
    <circle cx="432" cy="343" r="15"/>
    <rect x="470" y="328" width="26" height="30" rx="4"/>
    <rect x="516" y="328" width="40" height="30" rx="4"/>
    <rect x="352" y="394" width="30" height="30" rx="4"/>
    <rect x="402" y="394" width="34" height="30" rx="4"/>
    <rect x="456" y="394" width="30" height="30" rx="4"/>
    <circle cx="530" cy="409" r="15"/>
    <rect x="352" y="460" width="44" height="30" rx="4"/>
    <rect x="416" y="460" width="26" height="30" rx="4"/>
    <rect x="462" y="460" width="42" height="30" rx="4"/>
    <rect x="524" y="460" width="32" height="30" rx="4"/>
  </g>
  <path d="M438 130l-16 76 28 62-22 58 18 66-14 62 12 60 18 62" fill="none" stroke="#3b2417" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M422 206l-44 26M450 268l44 22M420 386l-36 30M466 452l38 18" fill="none" stroke="#3b2417" stroke-width="5" stroke-linecap="round"/>
  <path d="M298 300c-10-16-4-36 14-44 16 10 18 32 4 44z" fill="#f4ead4" stroke="#3b2417" stroke-width="4" stroke-linejoin="round"/>
</svg>`

export const EXAMPLE_ARTIFACTS: ExampleArtifact[] = [
  {
    id: 'clay-jar',
    name: 'Cracked clay jar',
    origin: 'Nile Valley style',
    note: 'A long crack down the neck and body, plus a chip on the rim.',
    svg: jar,
  },
  {
    id: 'stone-bowl',
    name: 'Chipped stone bowl',
    origin: 'Roman tableware style',
    note: 'A split rim, a branching crack and a missing piece.',
    svg: bowl,
  },
  {
    id: 'stone-tablet',
    name: 'Fractured stone tablet',
    origin: 'Maya carved tablet style',
    note: 'One deep fracture with smaller cracks across the carving.',
    svg: tablet,
  },
]

/** Renders an example SVG into a real PNG File so the upload pipeline runs. */
export async function exampleToFile(example: ExampleArtifact): Promise<File> {
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(example.svg)}`
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image()
    i.onload = () => resolve(i)
    i.onerror = () => reject(new Error('Could not open the example.'))
    i.src = src
  })
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 700
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not draw the example.')
  ctx.fillStyle = '#f4ead4'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the example.'))), 'image/png')
  })
  return new File([blob], `${example.id}.png`, { type: 'image/png' })
}
