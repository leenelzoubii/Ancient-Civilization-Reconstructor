/* =====================================================================
   Illustration banners for each civilization
   Panoramic SVGs ported from the legacy site's js/illustrations.js.
   Each function returns an SVG string; `id` keeps gradient IDs unique.
   preserveAspectRatio="slice" fills the banner edge-to-edge.
   ===================================================================== */
export const CIV_ILLUSTRATIONS = {
  egypt: (id = 'e') => `
<svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pyramids of Giza beside the Nile">
  <defs>
    <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c77a"/><stop offset=".6" stop-color="#f9e2b4"/><stop offset="1" stop-color="#fbeed3"/></linearGradient>
    <linearGradient id="${id}sand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e4c48a"/><stop offset="1" stop-color="#c99f5f"/></linearGradient>
  </defs>
  <rect width="900" height="140" fill="url(#${id}sky)"/>
  <circle cx="782" cy="38" r="18" fill="#fff4d8" opacity=".9"/>
  <circle cx="782" cy="38" r="27" fill="#fff4d8" opacity=".25"/>
  <path d="M250 100 L360 22 L470 100 Z" fill="#f2e6c9"/><path d="M360 22 L470 100 L397 100 Z" fill="#dcc79c"/>
  <path d="M353 32 L360 22 L367 32 Z" fill="#d9a92e"/>
  <path d="M486 100 L540 50 L594 100 Z" fill="#eadcb9"/><path d="M540 50 L594 100 L557 100 Z" fill="#d0ba8d"/>
  <path d="M616 100 L656 68 L696 100 Z" fill="#d7b28c"/><path d="M656 68 L696 100 L669 100 Z" fill="#c09673"/>
  <path d="M0 100 Q240 92 480 98 T900 94 V140 H0 Z" fill="url(#${id}sand)"/>
  <path d="M0 112 Q240 106 470 112 T900 108 V140 H0 Z" fill="#3f7fa6" opacity=".88"/>
  <path d="M0 120 Q240 114 470 121 T900 116" fill="none" stroke="#8fc0dc" stroke-width="2" opacity=".7"/>
  <path d="M0 131 Q240 126 470 132 T900 128" fill="none" stroke="#8fc0dc" stroke-width="2" opacity=".55"/>
  <path d="M120 116 Q170 108 220 114 V122 H120 Z" fill="#e4c48a"/>
  <g fill="#4f7a32"><path d="M164 114 q4-26 0-42" stroke="#6e5034" stroke-width="4" fill="none"/><path d="M164 70 q-19-2-28 9 q16-3 28-7 q-9-15-26-15 q17 7 26 12 q3-17 17-22 q-7 13-15 22 q17-5 28 5 q-17-3-30-5z"/></g>
  <g><path d="M618 116 h46 l-9 11 h-28 z" fill="#7a5434"/><path d="M641 116 V78 L668 110 Z" fill="#fbf6ea"/><path d="M641 96 L624 112" stroke="#b8862b" stroke-width="1.5"/></g>
  <g fill="#6e5a44"><path d="M330 44 q4-4 8 0 q-4-1.5-8 0z"/><path d="M346 50 q4-4 8 0 q-4-1.5-8 0z"/><path d="M580 34 q4-4 8 0 q-4-1.5-8 0z"/></g>
</svg>`,
  rome: (id = 'r') => `
<svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Colosseum in Rome">
  <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4e4"/><stop offset="1" stop-color="#f1ead9"/></linearGradient></defs>
  <rect width="900" height="140" fill="url(#${id}sky)"/>
  <circle cx="770" cy="34" r="16" fill="#fff8e4" opacity=".85"/>
  <path d="M0 100 Q450 92 900 100 V140 H0 Z" fill="#8f9e5c"/>
  <path d="M270 100 V56 Q450 34 630 56 V100 Q450 114 270 100 Z" fill="#e7dcc3"/><path d="M270 56 Q450 34 630 56" fill="none" stroke="#d4c6a7" stroke-width="5"/>
  ${[59, 73, 87].map((y, r) =>
    Array.from({ length: 15 }, (_, i) => {
      const x = 278 + i * 24; const dy = Math.abs(i - 7) * 0.8;
      return `<path d="M${x} ${y + dy + 12} V${y + dy + 4} a5.5 5.5 0 0 1 11 0 V${y + dy + 12} Z" fill="${r === 0 ? '#9b8a68' : r === 1 ? '#a8956f' : '#b3a27f'}"/>`;
    }).join('')
  ).join('')}
  ${Array.from({ length: 23 }, (_, i) => {
    const x = 274 + i * 16; const y = 40 + Math.abs(i - 11) * 1.05;
    return `<rect x="${x}" y="${y}" width="4" height="10" fill="#c8b994"/>`;
  }).join('')}
  <path d="M0 114 Q450 100 900 114 V140 H0 Z" fill="#5a8a4a" opacity=".5"/>
</svg>`,
  maya: (id = 'm') => `
<svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Maya stepped pyramid in the rainforest">
  <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fcbd6"/><stop offset="1" stop-color="#e5f1df"/></linearGradient></defs>
  <rect width="900" height="140" fill="url(#${id}sky)"/>
  <g fill="#5a8a4a" opacity=".55"><circle cx="40" cy="92" r="40"/><circle cx="90" cy="86" r="34"/><circle cx="820" cy="88" r="38"/><circle cx="872" cy="92" r="36"/></g>
  ${Array.from({ length: 9 }, (_, i) => {
    const w = 260 - i * 22; const y = 112 - (i + 1) * 8;
    return `<rect x="${450 - w / 2}" y="${y}" width="${w}" height="8" fill="${i % 2 ? '#d9cfb3' : '#e6ddc4'}"/><rect x="${450 - w / 2}" y="${y + 6}" width="${w}" height="2" fill="#c3b896"/>`;
  }).join('')}
  <path d="M428 112 L450 42 H470 L472 112 Z" fill="#efe7d2"/>
  ${Array.from({ length: 22 }, (_, i) => `<line x1="${429 + i * 0.4}" x2="${471 - i * 0.4}" y1="${110 - i * 3.5}" y2="${110 - i * 3.5}" stroke="#cfc4a5" stroke-width="1.2"/>`).join('')}
  <rect x="432" y="26" width="36" height="18" fill="#efe7d2"/><rect x="430" y="26" width="40" height="5" fill="#a3412e"/>
  <rect x="438" y="34" width="6" height="10" fill="#3b3226"/><rect x="452" y="34" width="6" height="10" fill="#3b3226"/><rect x="466" y="34" width="6" height="10" fill="#3b3226"/>
  <path d="M0 114 Q450 102 900 114 V140 H0 Z" fill="#cfc6a6"/>
  <g fill="#2f5a2a"><circle cx="8" cy="114" r="20"/><circle cx="38" cy="120" r="18"/><circle cx="862" cy="116" r="20"/><circle cx="892" cy="120" r="18"/></g>
</svg>`,
  khorfakkan: (id = 'k') => `
<svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Khorfakkan Portuguese fort on the coast">
  <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4e4"/><stop offset="1" stop-color="#e5f1df"/></linearGradient></defs>
  <rect width="900" height="140" fill="url(#${id}sky)"/>
  <path d="M0 88 Q450 76 900 88 V140 H0 Z" fill="#d4a373"/>
  <path d="M0 98 Q450 90 900 98 V140 H0 Z" fill="#2f6b55" opacity=".6"/>
  <g fill="#b0573a"><rect x="420" y="52" width="60" height="40"/><rect x="430" y="62" width="40" height="20"/></g>
  <rect x="410" y="30" width="20" height="22" fill="#8c6239"/><rect x="470" y="30" width="20" height="22" fill="#8c6239"/>
  <rect x="430" y="30" width="40" height="6" fill="#a4502f"/>
  <path d="M420 50 Q450 44 480 50 Q450 56 420 50 Z" fill="#a4502f" opacity=".9"/>
  <circle cx="820" cy="50" r="12" fill="#fff8e4" opacity=".85"/>
  <g fill="#2f6b55"><path d="M60 110 Q120 100 200 110 T400 100 T600 110 T800 100 T900 110"/></g>
  <rect x="440" y="92" width="20" height="8" fill="#e56b4f"/><rect x="440" y="102" width="20" height="6" fill="#d4a373"/>
</svg>`,
  petra: (id = 'p') => `
<svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Petra Treasury rock-cut facade">
  <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4e4"/><stop offset="1" stop-color="#f1ead9"/></linearGradient></defs>
  <rect width="900" height="140" fill="url(#${id}sky)"/>
  <path d="M0 94 Q450 86 900 94 V140 H0 Z" fill="#b0573a"/>
  <g fill="#d4a373"><path d="M340 30 Q450 10 560 30 Q450 50 340 30 Z" fill="#c99f5f"/><path d="M340 30 Q450 10 560 30" fill="none" stroke="#a4502f" stroke-width="3"/></g>
  <rect x="390" y="50" width="120" height="14" fill="#d4a373"/><rect x="400" y="58" width="100" height="26" fill="#c99f5f" opacity=".9"/>
  <rect x="420" y="76" width="20" height="16" fill="#4a433a"/><rect x="460" y="76" width="20" height="16" fill="#4a433a"/>
  <rect x="370" y="94" width="160" height="8" fill="#a4502f"/>
  <rect x="380" y="106" width="24" height="18" fill="#d4a373"/><rect x="496" y="106" width="24" height="18" fill="#d4a373"/>
  <circle cx="820" cy="46" r="14" fill="#fff8e4" opacity=".85"/>
  <g fill="#2f6b55" opacity=".7"><path d="M60 116 Q180 106 340 116 T600 106 T900 116"/></g>
</svg>`,
  'al-jazirat-al-hamra': (id = 'a') => `
<svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Al-Jazirat Al-Hamra courtyard house with wind tower">
  <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4e4"/><stop offset="1" stop-color="#fbeed3"/></linearGradient></defs>
  <rect width="900" height="140" fill="url(#${id}sky)"/>
  <circle cx="820" cy="36" r="16" fill="#fff8e4" opacity=".85"/>
  <path d="M0 94 Q450 88 900 94 V140 H0 Z" fill="#d4a373"/>
  <g fill="#c99f5f"><rect x="360" y="62" width="60" height="32"/><rect x="370" y="70" width="40" height="24"/></g>
  <rect x="350" y="42" width="16" height="20" fill="#a4502f"/><rect x="524" y="42" width="16" height="20" fill="#a4502f"/>
  <rect x="366" y="42" width="18" height="10" fill="#8c6239"/><rect x="516" y="42" width="18" height="10" fill="#8c6239"/>
  <path d="M350 62 Q450 58 550 62 Q450 70 350 62 Z" fill="#d4a373" opacity=".9"/>
  <rect x="380" y="100" width="24" height="14" fill="#4a433a"/><rect x="496" y="100" width="24" height="14" fill="#4a433a"/>
  <g fill="#2f6b55" opacity=".6"><path d="M60 118 Q220 110 450 118 T680 110 900 118"/></g>
</svg>`,
  'dhayah-fort': (id = 'd') => `
<svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dhayah Fort hilltop fortress with palm grove">
  <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4e4"/><stop offset="1" stop-color="#fbeed3"/></linearGradient></defs>
  <rect width="900" height="140" fill="url(#${id}sky)"/>
  <circle cx="820" cy="34" r="14" fill="#fff8e4" opacity=".85"/>
  <path d="M0 98 Q450 92 900 98 V140 H0 Z" fill="#d4a373"/>
  <g fill="#b0573a"><rect x="420" y="54" width="60" height="36"/><rect x="430" y="64" width="40" height="26"/></g>
  <rect x="410" y="36" width="20" height="18" fill="#8c6239"/><rect x="470" y="36" width="20" height="18" fill="#8c6239"/>
  <rect x="430" y="36" width="40" height="5" fill="#a4502f"/>
  <path d="M420 52 Q450 48 480 52 Q450 60 420 52 Z" fill="#a4502f" opacity=".9"/>
  <g fill="#2f6b55" opacity=".7"><path d="M60 116 Q180 110 450 116 T720 110 900 116"/></g>
  <g fill="#7a5434"><path d="M240 118 q-8 12 -4 20 q-4-8 -8-16z"/><path d="M680 116 q8 12 4 20 q4-8 8-16z"/></g>
</svg>`,
};