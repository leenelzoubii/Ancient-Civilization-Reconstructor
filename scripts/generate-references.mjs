/**
 * Generates the nine reference images per civilization used by the artifact
 * analysis panel (colour palette + "reference images" tile).
 *
 * The artwork is drawn procedurally from each civilization's palette, so the
 * images are original to this project and ship as small SVG files in
 * public/references/<civ>/1.svg … 9.svg.
 *
 * Run: node scripts/generate-references.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const CIVS = {
  egypt: {
    label: 'Ancient Egypt',
    bg: '#f4ead4',
    body: '#d8b878',
    accent: '#23466b',
    dark: '#7a5a32',
    light: '#f7f2e8',
  },
  rome: {
    label: 'Ancient Rome',
    bg: '#f3e8d6',
    body: '#b5623a',
    accent: '#4a2f22',
    dark: '#7c3a1f',
    light: '#efe3c8',
  },
  maya: {
    label: 'The Maya',
    bg: '#eee6d2',
    body: '#c98b4a',
    accent: '#a3412e',
    dark: '#3b3226',
    light: '#e6ddc4',
  },
  'taj-mahal': {
    label: 'Mughal Empire',
    bg: '#f5efe2',
    body: '#efe6d2',
    accent: '#d9a92e',
    dark: '#8a6a3c',
    light: '#fffdf8',
  },
  petra: {
    label: 'Petra',
    bg: '#f2ddc9',
    body: '#b3745a',
    accent: '#8d4f3d',
    dark: '#4a2a1d',
    light: '#f0cfb2',
  },
  khorfakkan: {
    label: 'Khor Fakkan',
    bg: '#e8ece6',
    body: '#d9c9a6',
    accent: '#2f6f8f',
    dark: '#6b4a2f',
    light: '#f7f2e8',
  },
  'al-jazirat-al-hamra': {
    label: 'Al-Jazirat Al-Hamra',
    bg: '#f6e8d2',
    body: '#d9a878',
    accent: '#2f6b55',
    dark: '#6b4a2f',
    light: '#f0dcae',
  },
  'dhayah-fort': {
    label: 'Dhayah Fort',
    bg: '#f4e4cf',
    body: '#c98f63',
    accent: '#2f6b55',
    dark: '#4a2a1d',
    light: '#e8d5b2',
  },
}

/** Simple deterministic PRNG so the artwork is identical on every run. */
function rng(seed) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function vesselBody(c) {
  return `
    <path d="M150 62 h60 l4 26 q34 20 34 74 q0 66-46 86 h-44 q-46-20-46-86 q0-54 34-74z" fill="${c.body}"/>
    <path d="M150 62 h30 l-6 26 q-24 20-24 74 q0 66 34 86 h-20 q-46-20-46-86 q0-54 34-74z" fill="${c.light}" opacity=".35"/>
    <path d="M132 150 q48-14 96 0" stroke="${c.accent}" stroke-width="9" fill="none"/>
    <path d="M138 186 q42-10 84 0" stroke="${c.dark}" stroke-width="5" fill="none" opacity=".55"/>
    <ellipse cx="180" cy="62" rx="30" ry="7" fill="${c.dark}" opacity=".55"/>
    <ellipse cx="180" cy="62" rx="22" ry="5" fill="${c.bg}"/>`
}

function amphora(c) {
  return `
    <path d="M158 48 h44 l3 22 q28 22 28 78 q0 56-30 84 l-6 46 h-30 l-6-46 q-30-28-30-84 q0-56 28-78z" fill="${c.body}"/>
    <path d="M158 48 h22 l-5 22 q-20 22-20 78 q0 56 22 84 l-6 46 h-8 l-6-46 q-30-28-30-84 q0-56 28-78z" fill="${c.light}" opacity=".3"/>
    <path d="M158 58 q-30-6-34 22 q-2 24 20 26" stroke="${c.accent}" stroke-width="8" fill="none"/>
    <path d="M202 58 q30-6 34 22 q2 24-20 26" stroke="${c.accent}" stroke-width="8" fill="none"/>
    <path d="M142 128 q38-12 76 0" stroke="${c.accent}" stroke-width="10" fill="none"/>
    <path d="M146 160 q34-8 68 0" stroke="${c.dark}" stroke-width="4" fill="none" opacity=".5"/>`
}

function bowl(c) {
  return `
    <path d="M76 138 h208 q-8 92-104 92 q-96 0-104-92z" fill="${c.body}"/>
    <path d="M76 138 h208 q-3 30-22 52 q-16-22-82-22 q-66 0-82 22 q-19-22-22-52z" fill="${c.light}" opacity=".35"/>
    <ellipse cx="180" cy="138" rx="104" ry="14" fill="${c.dark}" opacity=".55"/>
    <ellipse cx="180" cy="138" rx="94" ry="10" fill="${c.bg}"/>
    <path d="M96 168 q84-14 168 0" stroke="${c.accent}" stroke-width="8" fill="none"/>
    <path d="M132 230 h96 l-8 20 h-80z" fill="${c.dark}" opacity=".8"/>`
}

function jar(c) {
  return `
    <path d="M146 56 h68 l6 30 q40 26 40 84 q0 56-48 74 h-64 q-48-18-48-74 q0-58 40-84z" fill="${c.body}"/>
    <path d="M146 56 h34 l-8 30 q-30 26-30 84 q0 56 36 74 h-14 q-48-18-48-74 q0-58 40-84z" fill="${c.light}" opacity=".32"/>
    <rect x="140" y="46" width="80" height="14" rx="6" fill="${c.dark}" opacity=".75"/>
    <path d="M126 122 q54-16 108 0" stroke="${c.accent}" stroke-width="9" fill="none"/>
    <circle cx="180" cy="164" r="20" fill="none" stroke="${c.accent}" stroke-width="7"/>
    <path d="M136 204 q44-10 88 0" stroke="${c.dark}" stroke-width="5" fill="none" opacity=".5"/>`
}

function plaque(c, R) {
  let glyphs = ''
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 3; x++) {
      const cx = 132 + x * 48
      const cy = 92 + y * 42
      const r = 8 + R() * 8
      glyphs +=
        R() > 0.5
          ? `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="3" fill="${c.accent}"/>`
          : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c.accent}"/>`
    }
  }
  return `
    <rect x="86" y="52" width="188" height="196" rx="14" fill="${c.body}"/>
    <rect x="86" y="52" width="188" height="196" rx="14" fill="none" stroke="${c.dark}" stroke-width="5"/>
    <rect x="104" y="70" width="152" height="160" rx="8" fill="${c.light}" opacity=".55"/>
    ${glyphs}
    <path d="M86 240 h188" stroke="${c.dark}" stroke-width="6" opacity=".4"/>`
}

function column(c) {
  let flutes = ''
  for (let i = 0; i < 7; i++) {
    flutes += `<rect x="${140 + i * 11}" y="96" width="4" height="140" fill="${c.dark}" opacity=".22"/>`
  }
  return `
    <rect x="126" y="72" width="108" height="18" rx="4" fill="${c.dark}" opacity=".75"/>
    <rect x="120" y="90" width="120" height="16" rx="4" fill="${c.body}"/>
    <rect x="136" y="106" width="88" height="130" fill="${c.body}"/>
    ${flutes}
    <rect x="126" y="236" width="108" height="16" rx="4" fill="${c.dark}" opacity=".7"/>
    <path d="M120 106 q30-10 60 0 q30-10 60 0" stroke="${c.accent}" stroke-width="6" fill="none"/>`
}

function mask(c) {
  return `
    <path d="M180 50 q74 0 74 84 q0 92-74 124 q-74-32-74-124 q0-84 74-84z" fill="${c.body}"/>
    <path d="M180 50 q-74 0-74 84 q0 92 74 124 q-18-30-18-84 q0-64 18-124z" fill="${c.light}" opacity=".3"/>
    <path d="M124 66 q56-22 112 0 l-8 18 q-48-18-96 0z" fill="${c.accent}"/>
    <ellipse cx="152" cy="122" rx="18" ry="11" fill="${c.dark}"/>
    <ellipse cx="208" cy="122" rx="18" ry="11" fill="${c.dark}"/>
    <path d="M180 128 v34 l-14 8" stroke="${c.dark}" stroke-width="6" fill="none" stroke-linecap="round"/>
    <path d="M152 200 q28 12 56 0" stroke="${c.accent}" stroke-width="8" fill="none" stroke-linecap="round"/>`
}

function coin(c) {
  let beads = ''
  for (let i = 0; i < 36; i++) {
    const a = (i / 36) * Math.PI * 2
    beads += `<circle cx="${180 + Math.cos(a) * 92}" cy="${150 + Math.sin(a) * 92}" r="3.4" fill="${c.dark}" opacity=".5"/>`
  }
  return `
    <circle cx="180" cy="150" r="96" fill="${c.body}"/>
    <circle cx="180" cy="150" r="96" fill="none" stroke="${c.dark}" stroke-width="6"/>
    <circle cx="180" cy="150" r="76" fill="none" stroke="${c.accent}" stroke-width="5" opacity=".7"/>
    ${beads}
    <path d="M152 108 q34-14 58 10 q14 22-10 30 q-22 8-30 26 q-6 16 14 22" stroke="${c.dark}" stroke-width="8" fill="none" stroke-linecap="round"/>
    <circle cx="214" cy="196" r="6" fill="${c.dark}"/>`
}

function tablet(c, R) {
  let rows = ''
  for (let y = 0; y < 6; y++) {
    const w = 96 + R() * 44
    rows += `<rect x="128" y="${82 + y * 26}" width="${w}" height="8" rx="4" fill="${c.accent}" opacity="${0.55 + R() * 0.4}"/>`
  }
  return `
    <path d="M112 54 h136 l10 22 v168 h-156 v-168z" fill="${c.body}"/>
    <path d="M112 54 h136 l10 22 v168 h-156 v-168z" fill="none" stroke="${c.dark}" stroke-width="5"/>
    ${rows}
    <path d="M120 68 q60-14 120 0" stroke="${c.dark}" stroke-width="5" fill="none" opacity=".5"/>`
}

const MOTIFS = [vesselBody, amphora, bowl, jar, plaque, column, mask, coin, tablet]

function makeSvg(civ, index) {
  const c = CIVS[civ]
  const R = rng(index * 977 + civ.length * 131)
  const motif = MOTIFS[(index - 1) % MOTIFS.length](c, R)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300" role="img" aria-label="${c.label} reference artifact ${index}">
  <rect width="360" height="300" fill="${c.bg}"/>
  <circle cx="292" cy="52" r="58" fill="${c.light}" opacity=".5"/>
  <ellipse cx="180" cy="262" rx="112" ry="14" fill="${c.dark}" opacity=".14"/>
  <g>${motif}</g>
  <rect x="0" y="0" width="360" height="300" fill="url(#v${index})" opacity=".35"/>
  <defs><linearGradient id="v${index}" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity=".5"/>
    <stop offset=".55" stop-color="#000" stop-opacity="0"/>
    <stop offset="1" stop-color="#000" stop-opacity=".28"/>
  </linearGradient></defs>
</svg>`
}

const outRoot = path.join(process.cwd(), 'public', 'references')
for (const civ of Object.keys(CIVS)) {
  const dir = path.join(outRoot, civ)
  fs.mkdirSync(dir, { recursive: true })
  for (let i = 1; i <= 9; i++) {
    fs.writeFileSync(path.join(dir, `${i}.svg`), makeSvg(civ, i), 'utf8')
  }
  console.log(`${civ}: 9 reference images`)
}
console.log('done')
