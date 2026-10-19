/* Vector illustrations ported verbatim from the legacy site's js/illustrations.js.
   Each function returns an SVG string; `id` keeps gradient IDs unique per instance. */

const egypt = (id = 'e') => `
  <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pyramids of Giza beside the Nile">
    <defs>
      <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c77a"/><stop offset=".6" stop-color="#f9e2b4"/><stop offset="1" stop-color="#fbeed3"/></linearGradient>
      <linearGradient id="${id}sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4c48a"/><stop offset="1" stop-color="#c99f5f"/></linearGradient>
    </defs>
    <rect width="400" height="260" fill="url(#${id}sky)"/>
    <circle cx="300" cy="78" r="30" fill="#fff4d8" opacity=".9"/>
    <circle cx="300" cy="78" r="46" fill="#fff4d8" opacity=".25"/>
    <path d="M60 196 L150 74 L240 196 Z" fill="#f2e6c9"/><path d="M150 74 L240 196 L176 196 Z" fill="#dcc79c"/>
    <path d="M142 85 L150 74 L158 85 Z" fill="#d9a92e"/>
    <path d="M206 196 L272 104 L338 196 Z" fill="#eadcb9"/><path d="M272 104 L338 196 L292 196 Z" fill="#d0ba8d"/>
    <path d="M318 196 L352 150 L386 196 Z" fill="#d7b28c"/><path d="M352 150 L386 196 L362 196 Z" fill="#c09673"/>
    <path d="M0 200 Q100 186 200 198 T400 194 V260 H0 Z" fill="url(#${id}sand)"/>
    <path d="M0 226 Q120 214 230 228 T400 222 V260 H0 Z" fill="#3f7fa6" opacity=".85"/>
    <path d="M0 236 Q140 228 260 238 T400 234" stroke="#8fc0dc" stroke-width="2" fill="none" opacity=".7"/>
    <g fill="#4f7a32"><path d="M30 214 q8-22 2-40" stroke="#6e5034" stroke-width="3" fill="none"/>
      <path d="M32 174 q-16-2-24 8 q14-2 24-6 q-8-12-22-12 q14 6 22 10 q2-14 14-18 q-6 10-12 18 q14-4 24 4 q-14-2-26 -4z"/></g>
    <path d="M110 232 h34 l-6 8 h-22 z" fill="#7a5434"/><path d="M128 232 V196 L148 230 Z" fill="#fbf6ea"/>
  </svg>`

const rome = (id = 'r') => `
  <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Colosseum in Rome">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4e4"/><stop offset="1" stop-color="#f1ead9"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#${id}sky)"/>
    <ellipse cx="200" cy="206" rx="170" ry="26" fill="#cbbd9f"/>
    <path d="M52 200 V92 Q200 62 348 92 V200 Q200 226 52 200 Z" fill="#e7dcc3"/>
    <path d="M52 92 Q200 62 348 92 V104 Q200 76 52 104 Z" fill="#d4c6a7"/>
    ${[0, 1, 2].map(r => {
      const y = 112 + r * 30;
      let s = '';
      for (let i = 0; i < 11; i++) {
        const x = 66 + i * 25.6, curve = Math.abs(i - 5) * 1.6;
        s += `<path d="M${x} ${y + 24 + curve} V${y + 8 + curve} a8 8 0 0 1 16 0 V${y + 24 + curve} Z" fill="${r === 0 ? '#9b8a68' : '#b3a27f'}"/>`;
      }
      return s + `<path d="M52 ${y + 26} Q200 ${y + 2 + 26} 348 ${y + 26}" stroke="#cdbf9f" stroke-width="3" fill="none"/>`;
    }).join('')}
    ${Array.from({ length: 22 }, (_, i) => `<rect x="${60 + i * 13.2}" y="${96 + Math.abs(i - 10.5) * 0.9}" width="3" height="10" fill="#c8b994"/>`).join('')}
    <path d="M0 214 Q200 200 400 214 V260 H0 Z" fill="#8f9e5c"/>
    <g fill="#3b5a2f"><path d="M24 214 l8-58 l8 58z"/><path d="M372 214 l7-48 l7 48z"/><path d="M356 216 l6-34 l6 34z"/></g>
  </svg>`

const maya = (id = 'm') => `
  <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Maya stepped pyramid in the rainforest">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fcbd6"/><stop offset="1" stop-color="#e5f1df"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#${id}sky)"/>
    <g fill="#5a8a4a" opacity=".55"><circle cx="40" cy="170" r="40"/><circle cx="90" cy="160" r="34"/><circle cx="320" cy="164" r="38"/><circle cx="372" cy="170" r="36"/></g>
    ${Array.from({ length: 9 }, (_, i) => {
      const w = 260 - i * 22, y = 210 - (i + 1) * 15;
      return `<rect x="${200 - w / 2}" y="${y}" width="${w}" height="15" fill="${i % 2 ? '#d9cfb3' : '#e6ddc4'}"/><rect x="${200 - w / 2}" y="${y + 12}" width="${w}" height="3" fill="#c3b896"/>`;
    }).join('')}
    <path d="M178 210 L190 75 H210 L222 210 Z" fill="#efe7d2"/>
    ${Array.from({ length: 22 }, (_, i) => `<line x1="${179 + i * 0.55}" x2="${221 - i * 0.55}" y1="${206 - i * 6.1}" y2="${206 - i * 6.1}" stroke="#cfc4a5" stroke-width="1.2"/>`).join('')}
    <rect x="172" y="44" width="56" height="32" fill="#efe7d2"/><rect x="170" y="44" width="60" height="8" fill="#a3412e"/>
    <rect x="182" y="58" width="9" height="18" fill="#3b3226"/><rect x="196" y="58" width="9" height="18" fill="#3b3226"/><rect x="210" y="58" width="9" height="18" fill="#3b3226"/>
    <path d="M0 212 Q200 200 400 212 V260 H0 Z" fill="#cfc6a6"/>
    <g fill="#2f5a2a"><circle cx="16" cy="212" r="30"/><circle cx="58" cy="222" r="26"/><circle cx="350" cy="214" r="30"/><circle cx="392" cy="222" r="26"/></g>
  </svg>`

export const CIV_ILLUSTRATIONS: Record<string, (id?: string) => string> = {
  egypt,
  rome,
  maya,
}
