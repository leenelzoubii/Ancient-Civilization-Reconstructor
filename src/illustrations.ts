/* Vector illustrations ported from the legacy site's js/illustrations.js, recomposed
   as panoramic 900x140 banners. Each function returns an SVG string; `id` keeps
   gradient IDs unique per instance. preserveAspectRatio="slice" fills the banner
   strip edge-to-edge with a gentle center crop. */

const romeArches = () =>
  [59, 73, 87]
    .map((y, r) =>
      Array.from({ length: 15 }, (_, i) => {
        const x = 278 + i * 24
        const dy = Math.abs(i - 7) * 0.8
        return `<path d="M${x} ${y + dy + 12} V${y + dy + 4} a5.5 5.5 0 0 1 11 0 V${y + dy + 12} Z" fill="${r === 0 ? '#9b8a68' : r === 1 ? '#a8956f' : '#b3a27f'}"/>`
      }).join('')
    )
    .join('')

const egypt = (id = 'e') => `
  <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pyramids of Giza beside the Nile">
    <defs>
      <linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6c77a"/><stop offset=".6" stop-color="#f9e2b4"/><stop offset="1" stop-color="#fbeed3"/></linearGradient>
    </defs>
    <rect width="900" height="140" fill="url(#${id}sky)"/>
    <circle cx="782" cy="38" r="18" fill="#fff4d8" opacity=".9"/>
    <circle cx="782" cy="38" r="27" fill="#fff4d8" opacity=".25"/>
    <path d="M250 100 L360 22 L470 100 Z" fill="#f2e6c9"/>
    <path d="M360 22 L470 100 L397 100 Z" fill="#dcc79c"/>
    <path d="M353 32 L360 22 L367 32 Z" fill="#d9a92e"/>
    <path d="M486 100 L540 50 L594 100 Z" fill="#eadcb9"/>
    <path d="M540 50 L594 100 L557 100 Z" fill="#d0ba8d"/>
    <path d="M616 100 L656 68 L696 100 Z" fill="#d7b28c"/>
    <path d="M656 68 L696 100 L669 100 Z" fill="#c09673"/>
    <path d="M0 100 Q240 92 480 98 T900 94 V140 H0 Z" fill="#e4c48a"/>
    <path d="M0 112 Q240 106 470 112 T900 108 V140 H0 Z" fill="#3f7fa6" opacity=".88"/>
    <path d="M0 120 Q240 114 470 121 T900 116" fill="none" stroke="#8fc0dc" stroke-width="2" opacity=".7"/>
    <path d="M0 131 Q240 126 470 132 T900 128" fill="none" stroke="#8fc0dc" stroke-width="2" opacity=".55"/>
    <path d="M120 116 Q170 108 220 114 V122 H120 Z" fill="#e4c48a"/>
    <g fill="#4f7a32">
      <path d="M164 114 q4-26 0-42" stroke="#6e5034" stroke-width="4" fill="none"/>
      <path d="M164 70 q-19-2-28 9 q16-3 28-7 q-9-15-26-15 q17 7 26 12 q3-17 17-22 q-7 13-15 22 q17-5 28 5 q-17-3-30-5z"/>
    </g>
    <g>
      <path d="M618 116 h46 l-9 11 h-28 z" fill="#7a5434"/>
      <path d="M641 116 V78 L668 110 Z" fill="#fbf6ea"/>
      <path d="M641 96 L624 112" stroke="#b8862b" stroke-width="1.5"/>
    </g>
    <g fill="#6e5a44"><path d="M330 44 q4-4 8 0 q-4-1.5-8 0z"/><path d="M346 50 q4-4 8 0 q-4-1.5-8 0z"/><path d="M580 34 q4-4 8 0 q-4-1.5-8 0z"/></g>
  </svg>`

const rome = (id = 'r') => `
  <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Colosseum in Rome">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc4e4"/><stop offset="1" stop-color="#f1ead9"/></linearGradient></defs>
    <rect width="900" height="140" fill="url(#${id}sky)"/>
    <circle cx="770" cy="34" r="16" fill="#fff8e4" opacity=".85"/>
    <path d="M0 100 Q450 92 900 100 V140 H0 Z" fill="#8f9e5c"/>
    <path d="M270 100 V56 Q450 34 630 56 V100 Q450 114 270 100 Z" fill="#e7dcc3"/>
    <path d="M270 56 Q450 34 630 56" fill="none" stroke="#d4c6a7" stroke-width="5"/>
    ${romeArches()}
    ${Array.from({ length: 23 }, (_, i) => {
      const x = 274 + i * 16
      const y = 40 + Math.abs(i - 11) * 1.05
      return `<rect x="${x}" y="${y}" width="3" height="8" fill="#c8b994"/>`
    }).join('')}
    <path d="M0 118 Q120 112 240 118 T480 116 T900 118 V140 H0 Z" fill="#7d8f50"/>
    <g fill="#2f5a2a">
      <ellipse cx="150" cy="76" rx="8" ry="24"/><rect x="147" y="96" width="6" height="16" fill="#6b4f30"/>
      <ellipse cx="750" cy="80" rx="7" ry="22"/><rect x="747" y="98" width="6" height="14" fill="#6b4f30"/>
      <ellipse cx="196" cy="94" rx="6" ry="14"/><rect x="194" y="104" width="4" height="10" fill="#6b4f30"/>
      <ellipse cx="706" cy="96" rx="6" ry="13"/><rect x="704" y="105" width="4" height="9" fill="#6b4f30"/>
    </g>
    <g fill="#5b7a3a"><ellipse cx="80" cy="124" rx="16" ry="6"/><ellipse cx="830" cy="126" rx="18" ry="6"/><ellipse cx="450" cy="132" rx="30" ry="6" opacity=".7"/></g>
  </svg>`

const maya = (id = 'm') => `
  <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Maya stepped pyramid in the rainforest">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fcbd6"/><stop offset="1" stop-color="#e5f1df"/></linearGradient></defs>
    <rect width="900" height="140" fill="url(#${id}sky)"/>
    <circle cx="130" cy="34" r="17" fill="#fff8e4" opacity=".85"/>
    <g fill="#5a8a4a" opacity=".6">
      <circle cx="40" cy="84" r="42"/><circle cx="100" cy="76" r="34"/><circle cx="170" cy="88" r="30"/>
      <circle cx="730" cy="84" r="34"/><circle cx="800" cy="76" r="40"/><circle cx="866" cy="88" r="32"/>
    </g>
    <path d="M0 100 Q450 93 900 100 V140 H0 Z" fill="#cfc6a6"/>
    ${Array.from({ length: 7 }, (_, i) => {
      const w = 260 - i * 30
      const y = 100 - (i + 1) * 9
      return `<rect x="${450 - w / 2}" y="${y}" width="${w}" height="9" fill="${i % 2 ? '#d9cfb3' : '#e6ddc4'}"/><rect x="${450 - w / 2}" y="${y + 7}" width="${w}" height="2" fill="#c3b896"/>`
    }).join('')}
    <path d="M436 37 L464 37 L486 100 L414 100 Z" fill="#efe7d2"/>
    ${Array.from({ length: 6 }, (_, j) => {
      const y = 37 + (j + 1) * 10
      const hw = 14 + (j + 1) * 3.7
      return `<line x1="${450 - hw}" x2="${450 + hw}" y1="${y}" y2="${y}" stroke="#cfc4a5" stroke-width="1.2"/>`
    }).join('')}
    <rect x="418" y="24" width="64" height="13" fill="#efe7d2"/>
    <path d="M414 24 L450 15 L486 24 Z" fill="#a3412e"/>
    <rect x="442" y="27" width="16" height="10" fill="#3b3226"/>
    <g fill="#2f5a2a">
      <circle cx="60" cy="118" r="34"/><circle cx="130" cy="126" r="28"/>
      <circle cx="770" cy="118" r="34"/><circle cx="844" cy="126" r="28"/>
      <circle cx="300" cy="132" r="22"/><circle cx="604" cy="134" r="20"/>
    </g>
    <g fill="#7fa84e"><ellipse cx="240" cy="130" rx="14" ry="5"/><ellipse cx="668" cy="130" rx="14" ry="5"/><ellipse cx="450" cy="136" rx="24" ry="5"/></g>
  </svg>`

const tajMahal = (id = 't') => `
  <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Taj Mahal with its reflecting pool">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d9a8"/><stop offset=".7" stop-color="#fbecd0"/><stop offset="1" stop-color="#fdf6e6"/></linearGradient></defs>
    <rect width="900" height="140" fill="url(#${id}sky)"/>
    <circle cx="800" cy="32" r="16" fill="#fff3d6" opacity=".85"/>
    <path d="M0 100 Q450 93 900 100 V140 H0 Z" fill="#8ba35e"/>
    <path d="M0 100 Q450 93 900 100 V108 H0 Z" fill="#7d9454"/>
    <rect x="316" y="90" width="268" height="9" fill="#e6ddc8"/>
    <rect x="310" y="99" width="280" height="6" fill="#d8ccb2"/>
    <rect x="372" y="52" width="156" height="40" fill="#f6f0e2"/>
    <path d="M436 92 V70 Q450 58 464 70 V92 Z" fill="#b9a98c"/>
    <path d="M440 92 V72 Q450 62 460 72 V92 Z" fill="#8f7f64"/>
    <path d="M392 92 V76 Q400 68 408 76 V92 Z" fill="#cbbfa4"/>
    <path d="M492 92 V76 Q500 68 508 76 V92 Z" fill="#cbbfa4"/>
    <rect x="426" y="44" width="48" height="10" fill="#efe8d6"/>
    <path d="M414 48 Q414 30 432 20 Q441 15 450 11 Q459 15 468 20 Q486 30 486 48 Z" fill="#f8f3e6"/>
    <path d="M422 46 Q422 32 436 24" fill="none" stroke="#e6dcc4" stroke-width="2"/>
    <circle cx="450" cy="9" r="3.5" fill="#d9a92e"/>
    <g fill="#f4edda">
      <circle cx="390" cy="48" r="7"/><rect x="387" y="50" width="6" height="5" fill="#e6dcc4"/>
      <circle cx="510" cy="48" r="7"/><rect x="507" y="50" width="6" height="5" fill="#e6dcc4"/>
    </g>
    <g fill="#f2ecdc">
      <rect x="334" y="44" width="10" height="48"/><ellipse cx="339" cy="42" rx="7.5" ry="5.5"/>
      <rect x="556" y="44" width="10" height="48"/><ellipse cx="561" cy="42" rx="7.5" ry="5.5"/>
      <rect x="316" y="56" width="8" height="36"/><ellipse cx="320" cy="54" rx="6" ry="4.5"/>
      <rect x="576" y="56" width="8" height="36"/><ellipse cx="580" cy="54" rx="6" ry="4.5"/>
    </g>
    <g fill="#dcd2b8">
      <rect x="331" y="62" width="16" height="3"/><rect x="553" y="62" width="16" height="3"/>
      <rect x="313" y="72" width="14" height="3"/><rect x="573" y="72" width="14" height="3"/>
    </g>
    <rect x="430" y="105" width="40" height="35" fill="#7fb3c8"/>
    <rect x="430" y="105" width="40" height="35" fill="none" stroke="#e8e0cc" stroke-width="3"/>
    <path d="M436 116 h28 M436 126 h28 M436 136 h28" stroke="#a7cddc" stroke-width="2"/>
    <g fill="#35603c">
      <ellipse cx="356" cy="86" rx="7" ry="18"/><rect x="354" y="100" width="4" height="10" fill="#6b4f30"/>
      <ellipse cx="544" cy="86" rx="7" ry="18"/><rect x="542" y="100" width="4" height="10" fill="#6b4f30"/>
      <ellipse cx="262" cy="90" rx="6" ry="15"/><rect x="260" y="102" width="4" height="8" fill="#6b4f30"/>
      <ellipse cx="640" cy="90" rx="6" ry="15"/><rect x="638" y="102" width="4" height="8" fill="#6b4f30"/>
    </g>
    <path d="M0 118 Q220 112 450 118 T900 116 V140 H0 Z" fill="#7d9454"/>
    <g fill="#5b7a3a"><ellipse cx="180" cy="128" rx="20" ry="6"/><ellipse cx="720" cy="128" rx="20" ry="6"/><ellipse cx="450" cy="136" rx="34" ry="5" opacity=".7"/></g>
  </svg>`

const khorfakkan = (id = 'k') => `
  <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Khor Fakkan Portuguese fort by the sea">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc8de"/><stop offset="1" stop-color="#f3e7cf"/></linearGradient></defs>
    <rect width="900" height="140" fill="url(#${id}sky)"/>
    <circle cx="140" cy="32" r="16" fill="#fff3d6" opacity=".8"/>
    <rect y="62" width="900" height="34" fill="#4f8fb2"/>
    <path d="M0 62 Q120 58 240 62 T480 61 T720 62 T900 61" fill="none" stroke="#7db8d0" stroke-width="2"/>
    <path d="M0 74 h900 M0 86 h900" stroke="#6aa8c4" stroke-width="1.5" opacity=".55"/>
    <path d="M0 96 Q450 90 900 96 V140 H0 Z" fill="#d9b98a"/>
    <path d="M240 104 Q330 88 450 88 Q580 88 664 104 Z" fill="#cbb691"/>
    <path d="M258 104 Q344 92 450 92 Q566 92 648 104 Z" fill="#d9b98a"/>
    <rect x="330" y="58" width="240" height="34" fill="#d8b887"/>
    <rect x="330" y="58" width="240" height="6" fill="#c9a670"/>
    <rect x="316" y="50" width="34" height="42" rx="3" fill="#cbaa78"/>
    <rect x="550" y="50" width="34" height="42" rx="3" fill="#cbaa78"/>
    <rect x="432" y="42" width="40" height="50" rx="3" fill="#d2b180"/>
    <g fill="#cbaa78">
      ${Array.from({ length: 5 }, (_, i) => `<rect x="${314 + i * 10}" y="44" width="7" height="7"/>`).join('')}
      ${Array.from({ length: 5 }, (_, i) => `<rect x="${548 + i * 10}" y="44" width="7" height="7"/>`).join('')}
      ${Array.from({ length: 5 }, (_, i) => `<rect x="${430 + i * 10}" y="36" width="7" height="7"/>`).join('')}
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${366 + i * 16}" y="52" width="8" height="6"/>`).join('')}
    </g>
    <rect x="442" y="70" width="16" height="22" rx="8" fill="#7a5a38"/>
    <rect x="444" y="74" width="12" height="18" rx="6" fill="#5e432a"/>
    <g fill="#b99568"><rect x="374" y="66" width="9" height="11" rx="4"/><rect x="398" y="66" width="9" height="11" rx="4"/><rect x="500" y="66" width="9" height="11" rx="4"/><rect x="524" y="66" width="9" height="11" rx="4"/></g>
    <line x1="452" y1="36" x2="452" y2="16" stroke="#6b4f30" stroke-width="2"/>
    <path d="M452 16 L476 22 L452 28 Z" fill="#b8862b"/>
    <g>
      <path d="M196 90 L196 74 L222 82 L196 86 Z" fill="#f4ecd8"/>
      <path d="M194 74 L194 88 L182 85 Z" fill="#e8dcc0"/>
      <path d="M176 90 h34 l-7 9 h-20 z" fill="#7a5434"/>
    </g>
    <g fill="#3f6e3a">
      <path d="M744 128 q3-30 0-44" stroke="#6b4f30" stroke-width="5" fill="none"/>
      <ellipse cx="746" cy="82" rx="17" ry="6"/><ellipse cx="735" cy="90" rx="13" ry="5" transform="rotate(-30 735 90)"/><ellipse cx="757" cy="90" rx="13" ry="5" transform="rotate(30 757 90)"/><ellipse cx="746" cy="76" rx="10" ry="4"/>
      <path d="M118 130 q3-26 0-38" stroke="#6b4f30" stroke-width="4" fill="none"/>
      <ellipse cx="120" cy="90" rx="14" ry="5"/><ellipse cx="110" cy="97" rx="11" ry="4" transform="rotate(-30 110 97)"/><ellipse cx="130" cy="97" rx="11" ry="4" transform="rotate(30 130 97)"/><ellipse cx="120" cy="85" rx="8" ry="4"/>
    </g>
    <path d="M0 116 Q240 110 470 116 T900 112 V140 H0 Z" fill="#c9a76e"/>
    <g fill="#b8925a"><ellipse cx="210" cy="126" rx="12" ry="4"/><ellipse cx="690" cy="130" rx="14" ry="4"/><ellipse cx="450" cy="134" rx="18" ry="4"/></g>
  </svg>`

const petra = (id = 'p') => `
  <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Treasury facade at Petra in its rose-red canyon">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4d9ad"/><stop offset="1" stop-color="#f9ecd2"/></linearGradient></defs>
    <rect width="900" height="140" fill="url(#${id}sky)"/>
    <path d="M0 0 H250 L232 140 H0 Z" fill="#c97b5a"/>
    <path d="M0 0 H148 L134 140 H0 Z" fill="#b96a4a"/>
    <path d="M56 0 L68 140 M120 0 L132 140" stroke="#a85a3e" stroke-width="3" opacity=".5"/>
    <path d="M900 0 H650 L668 140 H900 Z" fill="#c97b5a"/>
    <path d="M900 0 H752 L766 140 H900 Z" fill="#b96a4a"/>
    <path d="M844 0 L832 140 M780 0 L768 140" stroke="#a85a3e" stroke-width="3" opacity=".5"/>
    <rect x="310" y="60" width="280" height="46" fill="#e8b892"/>
    <rect x="310" y="60" width="280" height="5" fill="#dba078"/>
    ${[320, 360, 400, 500, 540, 580]
      .map(x => `<rect x="${x}" y="64" width="14" height="42" fill="#d9a078"/><rect x="${x - 3}" y="64" width="20" height="4" fill="#c98d64"/>`)
      .join('')}
    <path d="M436 106 V84 Q450 70 464 84 V106 Z" fill="#6e4530"/>
    <path d="M440 106 V86 Q450 74 460 86 V106 Z" fill="#4f3020"/>
    <rect x="310" y="36" width="130" height="24" fill="#e8b892"/>
    <rect x="460" y="36" width="130" height="24" fill="#e8b892"/>
    <path d="M310 36 L375 22 L440 36 Z" fill="#edc29c"/>
    <path d="M460 36 L525 22 L590 36 Z" fill="#edc29c"/>
    <path d="M320 36 L375 26 L430 36 Z" fill="#e0ae84"/>
    <path d="M470 36 L525 26 L580 36 Z" fill="#e0ae84"/>
    <rect x="424" y="34" width="52" height="26" fill="#e8b892"/>
    <path d="M420 34 L450 22 L480 34 Z" fill="#edc29c"/>
    <g fill="#d9a078"><rect x="430" y="38" width="8" height="20"/><rect x="444" y="38" width="8" height="20"/><rect x="458" y="38" width="8" height="20"/><rect x="470" y="38" width="6" height="20"/></g>
    <rect x="446" y="16" width="8" height="6" fill="#e0ae84"/>
    <ellipse cx="450" cy="14" rx="5" ry="4" fill="#e8b892"/>
    <path d="M296 106 H604 L604 112 H296 Z" fill="#d9a078"/>
    <path d="M0 112 Q450 104 900 112 V140 H0 Z" fill="#e2b184"/>
    <path d="M0 124 Q450 116 900 124" fill="none" stroke="#cf9a6c" stroke-width="2"/>
    <g fill="#a85a3e" opacity=".55"><path d="M232 20 L244 140 L228 140 Z"/><path d="M668 20 L656 140 L672 140 Z"/></g>
    <g fill="#b96a4a" opacity=".5"><ellipse cx="450" cy="134" rx="40" ry="5"/></g>
  </svg>`

const alJazirat = (id = 'j') => `
  <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Al-Jazirat Al-Hamra courtyard houses and wind tower">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d9a9"/><stop offset="1" stop-color="#fbf0da"/></linearGradient></defs>
    <rect width="900" height="140" fill="url(#${id}sky)"/>
    <circle cx="780" cy="30" r="16" fill="#fff3d6" opacity=".85"/>
    <rect y="58" width="900" height="26" fill="#7fb0c4"/>
    <path d="M0 62 h900 M0 70 h900 M0 78 h900" stroke="#a3cddc" stroke-width="1.5" opacity=".7"/>
    <path d="M0 80 Q450 74 900 80 V140 H0 Z" fill="#e6cf9f"/>
    <g>
      <rect x="206" y="78" width="96" height="28" fill="#dfc294"/>
      <rect x="206" y="78" width="96" height="5" fill="#cfae7e"/>
      <path d="M246 106 V94 Q254 86 262 94 V106 Z" fill="#7a5a38"/>
      <rect x="220" y="88" width="11" height="11" fill="#a8875c"/>
      <rect x="278" y="88" width="11" height="11" fill="#a8875c"/>
    </g>
    <g>
      <rect x="306" y="70" width="84" height="36" fill="#d4b285"/>
      <rect x="306" y="70" width="84" height="5" fill="#c29f70"/>
      <path d="M341 106 V94 Q348 86 355 94 V106 Z" fill="#6e5034"/>
      <rect x="316" y="80" width="10" height="10" fill="#a8875c"/>
      <rect x="372" y="80" width="10" height="10" fill="#a8875c"/>
    </g>
    <g>
      <rect x="560" y="74" width="90" height="32" fill="#dfc294"/>
      <rect x="560" y="74" width="90" height="5" fill="#cfae7e"/>
      <path d="M598 106 V94 Q605 86 612 94 V106 Z" fill="#7a5a38"/>
      <rect x="572" y="84" width="10" height="10" fill="#a8875c"/>
      <rect x="630" y="84" width="10" height="10" fill="#a8875c"/>
    </g>
    <g>
      <rect x="654" y="80" width="76" height="26" fill="#d4b285"/>
      <rect x="654" y="80" width="76" height="5" fill="#c29f70"/>
      <path d="M686 106 V96 Q692 89 698 96 V106 Z" fill="#6e5034"/>
      <rect x="664" y="89" width="9" height="9" fill="#a8875c"/>
      <rect x="712" y="89" width="9" height="9" fill="#a8875c"/>
    </g>
    <g>
      <rect x="404" y="54" width="36" height="52" fill="#e2c69a"/>
      <rect x="398" y="42" width="48" height="12" fill="#e8d0a8"/>
      <rect x="398" y="34" width="12" height="8" fill="#e8d0a8"/>
      <rect x="434" y="34" width="12" height="8" fill="#e8d0a8"/>
      <g fill="#8a6a44"><rect x="404" y="45" width="4" height="7"/><rect x="413" y="45" width="4" height="7"/><rect x="422" y="45" width="4" height="7"/><rect x="431" y="45" width="4" height="7"/></g>
      <rect x="416" y="66" width="9" height="11" fill="#a8875c"/>
      <rect x="416" y="84" width="9" height="11" fill="#a8875c"/>
    </g>
    <g>
      <line x1="482" y1="106" x2="482" y2="46" stroke="#8a6a44" stroke-width="3"/>
      <path d="M484 50 L524 90 L484 82 Z" fill="#f4ecd8"/>
      <path d="M484 50 L484 82 L470 78 Z" fill="#e8dcc0"/>
    </g>
    <g fill="#3f6e3a">
      <rect x="154" y="88" width="4" height="24" fill="#6b4f30"/>
      <ellipse cx="156" cy="84" rx="15" ry="6"/><ellipse cx="146" cy="90" rx="11" ry="5" transform="rotate(-30 146 90)"/><ellipse cx="166" cy="90" rx="11" ry="5" transform="rotate(30 166 90)"/><ellipse cx="156" cy="78" rx="9" ry="4"/>
      <rect x="784" y="90" width="4" height="22" fill="#6b4f30"/>
      <ellipse cx="786" cy="86" rx="13" ry="5"/><ellipse cx="777" cy="92" rx="10" ry="4" transform="rotate(-30 777 92)"/><ellipse cx="795" cy="92" rx="10" ry="4" transform="rotate(30 795 92)"/><ellipse cx="786" cy="81" rx="8" ry="3"/>
    </g>
    <path d="M0 112 Q450 106 900 112 V140 H0 Z" fill="#dcc28e"/>
    <g fill="#c2a068"><ellipse cx="250" cy="122" rx="13" ry="4"/><ellipse cx="470" cy="128" rx="15" ry="4"/><ellipse cx="690" cy="120" rx="12" ry="4"/><ellipse cx="120" cy="132" rx="14" ry="4"/><ellipse cx="810" cy="132" rx="14" ry="4"/></g>
  </svg>`

const dhayah = (id = 'd') => `
  <svg viewBox="0 0 900 140" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dhayah Fort on its hilltop above the palm oasis">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2cf9a"/><stop offset=".7" stop-color="#fae8c8"/><stop offset="1" stop-color="#fdf4e0"/></linearGradient></defs>
    <rect width="900" height="140" fill="url(#${id}sky)"/>
    <circle cx="140" cy="30" r="16" fill="#fff3d6" opacity=".85"/>
    <path d="M0 78 Q200 70 400 76 T700 72 T900 78 V140 H0 Z" fill="#d9b98a" opacity=".45"/>
    <path d="M110 126 Q270 58 450 54 Q640 52 800 126 Z" fill="#b98d5f"/>
    <path d="M170 126 Q300 72 450 68 Q610 66 740 126 Z" fill="#c69a6a"/>
    <path d="M220 120 Q330 84 450 80 Q580 78 690 120" fill="none" stroke="#a87c50" stroke-width="3" opacity=".55"/>
    <path d="M270 112 Q360 90 450 88 Q550 86 640 112" fill="none" stroke="#a87c50" stroke-width="2.5" opacity=".5"/>
    <g>
      <rect x="392" y="36" width="116" height="26" fill="#d8b487"/>
      <rect x="392" y="36" width="116" height="5" fill="#c69f70"/>
      ${Array.from({ length: 8 }, (_, i) => `<rect x="${388 + i * 16}" y="28" width="8" height="8" fill="#c69f70"/>`).join('')}
      <rect x="378" y="34" width="20" height="30" rx="2" fill="#cbaa7a"/>
      <rect x="502" y="34" width="20" height="30" rx="2" fill="#cbaa7a"/>
      <g fill="#cbaa7a"><rect x="376" y="27" width="7" height="7"/><rect x="387" y="27" width="7" height="7"/><rect x="500" y="27" width="7" height="7"/><rect x="511" y="27" width="7" height="7"/></g>
      <rect x="442" y="46" width="16" height="16" rx="8" fill="#7a5a38"/>
      <rect x="404" y="42" width="7" height="8" fill="#8a6a44"/>
      <rect x="489" y="42" width="7" height="8" fill="#8a6a44"/>
      <line x1="450" y1="28" x2="450" y2="14" stroke="#6b4f30" stroke-width="2"/>
      <path d="M450 14 L472 19 L450 25 Z" fill="#b8862b"/>
    </g>
    <path d="M392 62 L372 76 L530 76 L508 62 Z" fill="#a87c50"/>
    <path d="M372 76 L362 84 H540 L530 76 Z" fill="#8a6240"/>
    <g fill="#3f6e3a">
      <rect x="248" y="104" width="4" height="26" fill="#6b4f30"/><ellipse cx="250" cy="100" rx="13" ry="5"/><ellipse cx="241" cy="106" rx="10" ry="4" transform="rotate(-30 241 106)"/><ellipse cx="259" cy="106" rx="10" ry="4" transform="rotate(30 259 106)"/><ellipse cx="250" cy="95" rx="8" ry="3"/>
      <rect x="292" y="110" width="4" height="22" fill="#6b4f30"/><ellipse cx="294" cy="106" rx="11" ry="4"/><ellipse cx="286" cy="111" rx="8" ry="3" transform="rotate(-30 286 111)"/><ellipse cx="302" cy="111" rx="8" ry="3" transform="rotate(30 302 111)"/><ellipse cx="294" cy="102" rx="7" ry="3"/>
      <rect x="614" y="106" width="4" height="24" fill="#6b4f30"/><ellipse cx="616" cy="102" rx="12" ry="5"/><ellipse cx="607" cy="108" rx="9" ry="4" transform="rotate(-30 607 108)"/><ellipse cx="625" cy="108" rx="9" ry="4" transform="rotate(30 625 108)"/><ellipse cx="616" cy="97" rx="8" ry="3"/>
      <rect x="662" y="112" width="4" height="20" fill="#6b4f30"/><ellipse cx="664" cy="108" rx="10" ry="4"/><ellipse cx="656" cy="113" rx="8" ry="3" transform="rotate(-30 656 113)"/><ellipse cx="672" cy="113" rx="8" ry="3" transform="rotate(30 672 113)"/><ellipse cx="664" cy="104" rx="7" ry="3"/>
    </g>
    <path d="M0 124 Q450 116 900 124 V140 H0 Z" fill="#c9a76e"/>
    <g fill="#b8925a"><ellipse cx="170" cy="132" rx="11" ry="3"/><ellipse cx="450" cy="136" rx="16" ry="3"/><ellipse cx="740" cy="130" rx="10" ry="3"/></g>
  </svg>`

export const CIV_ILLUSTRATIONS: Record<string, (id?: string) => string> = {
  egypt,
  rome,
  maya,
  'taj-mahal': tajMahal,
  khorfakkan,
  petra,
  'al-jazirat-al-hamra': alJazirat,
  'dhayah-fort': dhayah,
}
