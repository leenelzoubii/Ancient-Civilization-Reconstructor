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

const tajMahal = (id = 't') => `
  <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Taj Mahal with its reflecting pool">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6d9a8"/><stop offset=".7" stop-color="#fbecd0"/><stop offset="1" stop-color="#fdf6e6"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#${id}sky)"/>
    <circle cx="320" cy="60" r="26" fill="#fff3d6" opacity=".85"/>
    <rect y="196" width="400" height="64" fill="#8ba35e"/>
    <rect y="196" width="400" height="10" fill="#7d9454"/>
    <rect x="168" y="206" width="64" height="54" fill="#7fb3c8"/>
    <rect x="168" y="206" width="64" height="54" fill="none" stroke="#e8e0cc" stroke-width="3"/>
    <path d="M176 220 h48 M176 236 h48 M176 252 h48" stroke="#a7cddc" stroke-width="2"/>
    <rect x="92" y="184" width="216" height="16" fill="#e6ddc8"/>
    <rect x="88" y="196" width="224" height="8" fill="#d8ccb2"/>
    <rect x="140" y="118" width="120" height="68" fill="#f6f0e2"/>
    <path d="M185 186 V148 Q200 128 215 148 V186 Z" fill="#b9a98c"/>
    <path d="M190 186 V150 Q200 134 210 150 V186 Z" fill="#8f7f64"/>
    <path d="M150 186 V156 Q158 144 166 156 V186 Z" fill="#cbbfa4"/>
    <path d="M234 186 V156 Q242 144 250 156 V186 Z" fill="#cbbfa4"/>
    <rect x="176" y="104" width="48" height="16" fill="#efe8d6"/>
    <path d="M162 106 Q162 72 182 56 Q192 48 200 40 Q208 48 218 56 Q238 72 238 106 Z" fill="#f8f3e6"/>
    <path d="M170 104 Q170 76 186 62 Q194 55 200 48" fill="none" stroke="#e6dcc4" stroke-width="2"/>
    <line x1="200" y1="40" x2="200" y2="28" stroke="#b8862b" stroke-width="2"/>
    <circle cx="200" cy="26" r="3" fill="#d9a92e"/>
    <circle cx="150" cy="114" r="7" fill="#f4edda"/><rect x="147" y="116" width="6" height="6" fill="#e6dcc4"/>
    <circle cx="250" cy="114" r="7" fill="#f4edda"/><rect x="247" y="116" width="6" height="6" fill="#e6dcc4"/>
    <g fill="#f2ecdc">
      <rect x="106" y="108" width="9" height="80"/><ellipse cx="110.5" cy="106" rx="8" ry="6"/><line x1="110.5" y1="98" x2="110.5" y2="92" stroke="#b8862b" stroke-width="1.5"/>
      <rect x="285" y="108" width="9" height="80"/><ellipse cx="289.5" cy="106" rx="8" ry="6"/><line x1="289.5" y1="98" x2="289.5" y2="92" stroke="#b8862b" stroke-width="1.5"/>
      <rect x="122" y="124" width="7" height="64"/><ellipse cx="125.5" cy="122" rx="6.5" ry="5"/>
      <rect x="271" y="124" width="7" height="64"/><ellipse cx="274.5" cy="122" rx="6.5" ry="5"/>
    </g>
    <g fill="#dcd2b8"><rect x="104" y="136" width="13" height="3"/><rect x="283" y="136" width="13" height="3"/><rect x="120" y="148" width="11" height="3"/><rect x="269" y="148" width="11" height="3"/></g>
    <g fill="#35603c">
      <ellipse cx="60" cy="170" rx="7" ry="26"/><rect x="58.5" y="186" width="3" height="14" fill="#6b4f30"/>
      <ellipse cx="340" cy="170" rx="7" ry="26"/><rect x="338.5" y="186" width="3" height="14" fill="#6b4f30"/>
      <ellipse cx="84" cy="178" rx="6" ry="20"/><ellipse cx="316" cy="178" rx="6" ry="20"/>
    </g>
  </svg>`

const khorfakkan = (id = 'k') => `
  <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Khor Fakkan Portuguese fort by the sea">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9cc8de"/><stop offset="1" stop-color="#f3e7cf"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#${id}sky)"/>
    <circle cx="70" cy="58" r="24" fill="#fff3d6" opacity=".8"/>
    <rect y="158" width="400" height="50" fill="#4f8fb2"/>
    <path d="M0 158 Q60 152 120 158 T240 156 T400 158" fill="none" stroke="#7db8d0" stroke-width="2"/>
    <path d="M0 176 h400 M0 192 h400" stroke="#6aa8c4" stroke-width="1.5" opacity=".6"/>
    <path d="M30 208 Q120 168 210 176 L330 186 Q370 196 400 208 V260 H0 Z" fill="#d9b98a"/>
    <path d="M30 208 Q120 168 210 176 L330 186 Q370 196 400 208" fill="none" stroke="#c4a274" stroke-width="2"/>
    <g fill="#cbb691">
      <path d="M120 176 L140 140 L180 136 L210 150 L230 174 Z" opacity=".5"/>
    </g>
    <rect x="132" y="118" width="150" height="66" fill="#d8b887"/>
    <rect x="132" y="118" width="150" height="8" fill="#c9a670"/>
    <rect x="124" y="104" width="30" height="80" rx="3" fill="#cbaa78"/>
    <rect x="262" y="104" width="30" height="80" rx="3" fill="#cbaa78"/>
    <rect x="188" y="96" width="38" height="88" rx="3" fill="#d2b180"/>
    <g fill="#cbaa78">
      <rect x="122" y="98" width="7" height="8"/><rect x="132" y="98" width="7" height="8"/><rect x="142" y="98" width="7" height="8"/><rect x="150" y="98" width="7" height="8"/>
      <rect x="260" y="98" width="7" height="8"/><rect x="270" y="98" width="7" height="8"/><rect x="280" y="98" width="7" height="8"/><rect x="288" y="98" width="7" height="8"/>
      <rect x="186" y="90" width="7" height="8"/><rect x="196" y="90" width="7" height="8"/><rect x="206" y="90" width="7" height="8"/><rect x="216" y="90" width="7" height="8"/><rect x="224" y="90" width="7" height="8"/>
      <rect x="160" y="112" width="8" height="7"/><rect x="174" y="112" width="8" height="7"/><rect x="236" y="112" width="8" height="7"/><rect x="250" y="112" width="8" height="7"/>
    </g>
    <rect x="196" y="146" width="16" height="38" rx="8" fill="#7a5a38"/>
    <rect x="198" y="150" width="12" height="30" rx="6" fill="#5e432a"/>
    <g fill="#b99568"><rect x="144" y="132" width="9" height="12" rx="4"/><rect x="164" y="132" width="9" height="12" rx="4"/><rect x="244" y="132" width="9" height="12" rx="4"/><rect x="264" y="132" width="9" height="12" rx="4"/></g>
    <line x1="207" y1="90" x2="207" y2="66" stroke="#6b4f30" stroke-width="2"/>
    <path d="M207 66 L232 72 L207 78 Z" fill="#b8862b"/>
    <g>
      <path d="M320 176 L320 160 L348 168 L320 172 Z" fill="#8a5e3c"/>
      <path d="M322 160 L344 166 L322 170 Z" fill="#f4ecd8"/>
      <path d="M316 176 h34 l-6 8 h-22 z" fill="#7a5434"/>
    </g>
    <g fill="#3f6e3a">
      <path d="M56 236 q2-28 0-40 q10 12 8 40 z" stroke="#6b4f30" stroke-width="3"/>
      <ellipse cx="58" cy="192" rx="16" ry="6"/><ellipse cx="50" cy="198" rx="12" ry="5" transform="rotate(-30 50 198)"/><ellipse cx="66" cy="198" rx="12" ry="5" transform="rotate(30 66 198)"/>
      <ellipse cx="58" cy="186" rx="10" ry="5"/>
    </g>
    <path d="M0 240 Q80 232 160 240 T400 236 V260 H0 Z" fill="#c9a76e"/>
  </svg>`

const petra = (id = 'p') => `
  <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="The Treasury facade at Petra in its rose-red canyon">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4d9ad"/><stop offset="1" stop-color="#f9ecd2"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#${id}sky)"/>
    <path d="M0 0 H130 L112 260 H0 Z" fill="#c97b5a"/>
    <path d="M0 0 H84 L70 260 H0 Z" fill="#b96a4a"/>
    <path d="M40 0 L52 260 M84 0 L96 260" stroke="#a85a3e" stroke-width="3" opacity=".5"/>
    <path d="M400 0 H270 L288 260 H400 Z" fill="#c97b5a"/>
    <path d="M400 0 H316 L330 260 H400 Z" fill="#b96a4a"/>
    <path d="M360 0 L348 260 M316 0 L304 260" stroke="#a85a3e" stroke-width="3" opacity=".5"/>
    <rect x="140" y="118" width="120" height="112" fill="#e8b892"/>
    <rect x="140" y="118" width="120" height="8" fill="#dbA078"/>
    <path d="M138 118 L200 84 L262 118 Z" fill="#edc29c"/>
    <path d="M148 118 L200 92 L252 118 Z" fill="#e0ae84"/>
    <path d="M162 118 L200 96 L238 118 Z" fill="#d49a70"/>
    <g fill="#d9a078">
      <rect x="148" y="126" width="10" height="92"/><rect x="168" y="126" width="10" height="92"/>
      <rect x="188" y="126" width="10" height="92"/><rect x="208" y="126" width="10" height="92"/>
      <rect x="228" y="126" width="10" height="92"/><rect x="244" y="126" width="10" height="92"/>
    </g>
    <g fill="#c98d64">
      <rect x="146" y="126" width="14" height="5"/><rect x="166" y="126" width="14" height="5"/>
      <rect x="186" y="126" width="14" height="5"/><rect x="206" y="126" width="14" height="5"/>
      <rect x="226" y="126" width="14" height="5"/><rect x="242" y="126" width="14" height="5"/>
    </g>
    <path d="M186 230 V186 Q200 166 214 186 V230 Z" fill="#6e4530"/>
    <path d="M190 230 V188 Q200 172 210 188 V230 Z" fill="#4f3020"/>
    <rect x="176" y="52" width="48" height="34" fill="#e8b892"/>
    <path d="M176 52 L200 34 L224 52 Z" fill="#edc29c"/>
    <circle cx="200" cy="42" r="4" fill="#d9a92e"/>
    <g fill="#d9a078"><rect x="182" y="56" width="7" height="26"/><rect x="194" y="56" width="7" height="26"/><rect x="206" y="56" width="7" height="26"/></g>
    <path d="M154 60 L176 52 L176 86 L154 78 Z" fill="#dbA078"/>
    <path d="M246 60 L224 52 L224 86 L246 78 Z" fill="#dbA078"/>
    <rect x="196" y="22" width="8" height="14" fill="#e0ae84"/>
    <ellipse cx="200" cy="20" rx="6" ry="5" fill="#e8b892"/>
    <rect x="128" y="230" width="144" height="10" fill="#d9a078"/>
    <path d="M0 240 Q200 228 400 240 V260 H0 Z" fill="#e2b184"/>
    <path d="M0 250 Q200 240 400 250" fill="none" stroke="#cf9a6c" stroke-width="2"/>
    <g fill="#a85a3e" opacity=".6"><path d="M112 60 L118 260 L108 260 Z"/><path d="M288 60 L282 260 L292 260 Z"/></g>
  </svg>`

const alJazirat = (id = 'j') => `
  <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Al-Jazirat Al-Hamra courtyard houses and wind tower">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3d9a9"/><stop offset="1" stop-color="#fbf0da"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#${id}sky)"/>
    <circle cx="330" cy="56" r="24" fill="#fff3d6" opacity=".85"/>
    <rect y="176" width="400" height="20" fill="#7fb0c4"/>
    <path d="M0 176 h400 M0 186 h400" stroke="#a3cddc" stroke-width="1.5" opacity=".7"/>
    <path d="M0 196 Q200 186 400 196 V260 H0 Z" fill="#e6cf9f"/>
    <path d="M0 216 Q200 206 400 216 V260 H0 Z" fill="#dcc28e"/>
    <g>
      <rect x="30" y="130" width="86" height="68" fill="#dfc294"/>
      <rect x="30" y="130" width="86" height="7" fill="#cfae7e"/>
      <rect x="64" y="160" width="18" height="38" rx="9" fill="#7a5a38"/>
      <rect x="42" y="142" width="12" height="12" fill="#a8875c"/>
      <rect x="94" y="142" width="12" height="12" fill="#a8875c"/>
    </g>
    <g>
      <rect x="124" y="144" width="70" height="54" fill="#d4b285"/>
      <rect x="124" y="144" width="70" height="6" fill="#c29f70"/>
      <rect x="150" y="166" width="16" height="32" rx="8" fill="#6e5034"/>
      <rect x="134" y="154" width="10" height="10" fill="#a8875c"/>
      <rect x="174" y="154" width="10" height="10" fill="#a8875c"/>
    </g>
    <g>
      <rect x="204" y="152" width="58" height="46" fill="#dfc294"/>
      <rect x="204" y="152" width="58" height="6" fill="#cfae7e"/>
      <rect x="226" y="170" width="14" height="28" rx="7" fill="#7a5a38"/>
    </g>
    <g>
      <rect x="290" y="138" width="82" height="60" fill="#d4b285"/>
      <rect x="290" y="138" width="82" height="6" fill="#c29f70"/>
      <rect x="322" y="162" width="16" height="36" rx="8" fill="#6e5034"/>
      <rect x="302" y="150" width="11" height="11" fill="#a8875c"/>
      <rect x="350" y="150" width="11" height="11" fill="#a8875c"/>
    </g>
    <g>
      <rect x="258" y="96" width="36" height="76" fill="#e2c69a"/>
      <rect x="258" y="96" width="36" height="6" fill="#d0b184"/>
      <rect x="252" y="82" width="14" height="18" fill="#e8d0a8"/>
      <rect x="270" y="82" width="14" height="18" fill="#e8d0a8"/>
      <rect x="252" y="82" width="32" height="5" fill="#d8bc90"/>
      <g fill="#8a6a44"><rect x="255" y="86" width="3" height="10"/><rect x="262" y="86" width="3" height="10"/><rect x="273" y="86" width="3" height="10"/><rect x="280" y="86" width="3" height="10"/></g>
      <rect x="266" y="120" width="8" height="12" fill="#a8875c"/>
      <rect x="266" y="142" width="8" height="12" fill="#a8875c"/>
    </g>
    <g>
      <line x1="150" y1="144" x2="150" y2="84" stroke="#8a6a44" stroke-width="3"/>
      <path d="M150 88 L188 118 L150 112 Z" fill="#f4ecd8"/>
      <path d="M150 88 L150 112 L136 108 Z" fill="#e8dcc0"/>
    </g>
    <g fill="#3f6e3a">
      <rect x="102" y="160" width="4" height="38" fill="#6b4f30"/>
      <ellipse cx="104" cy="156" rx="14" ry="6"/><ellipse cx="95" cy="162" rx="11" ry="5" transform="rotate(-30 95 162)"/><ellipse cx="113" cy="162" rx="11" ry="5" transform="rotate(30 113 162)"/><ellipse cx="104" cy="150" rx="9" ry="4"/>
      <rect x="372" y="164" width="4" height="34" fill="#6b4f30"/>
      <ellipse cx="374" cy="160" rx="12" ry="5"/><ellipse cx="366" cy="165" rx="9" ry="4" transform="rotate(-30 366 165)"/><ellipse cx="382" cy="165" rx="9" ry="4" transform="rotate(30 382 165)"/>
    </g>
    <path d="M0 232 Q100 224 200 232 T400 228 V260 H0 Z" fill="#d2b078"/>
    <g fill="#c2a068"><ellipse cx="60" cy="242" rx="10" ry="4"/><ellipse cx="180" cy="248" rx="12" ry="4"/><ellipse cx="300" cy="240" rx="9" ry="3"/></g>
  </svg>`

const dhayah = (id = 'd') => `
  <svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Dhayah Fort on its hilltop above the palm oasis">
    <defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2cf9a"/><stop offset=".7" stop-color="#fae8c8"/><stop offset="1" stop-color="#fdf4e0"/></linearGradient></defs>
    <rect width="400" height="260" fill="url(#${id}sky)"/>
    <circle cx="90" cy="64" r="26" fill="#fff3d6" opacity=".85"/>
    <path d="M0 150 Q80 140 160 150 T320 146 T400 152 V260 H0 Z" fill="#d9b98a" opacity=".45"/>
    <path d="M46 224 Q130 120 200 108 Q280 100 358 224 Z" fill="#b98d5f"/>
    <path d="M46 224 Q130 128 200 116 Q280 110 358 224 Z" fill="#c69a6a"/>
    <path d="M96 200 Q160 140 200 130 Q256 124 312 200" fill="none" stroke="#a87c50" stroke-width="3" opacity=".6"/>
    <path d="M130 180 Q180 140 200 136 Q236 132 274 176" fill="none" stroke="#a87c50" stroke-width="2.5" opacity=".5"/>
    <g>
      <rect x="168" y="96" width="64" height="40" fill="#d8b487"/>
      <rect x="168" y="96" width="64" height="6" fill="#c69f70"/>
      <g fill="#c69f70">
        <rect x="166" y="88" width="8" height="9"/><rect x="178" y="88" width="8" height="9"/><rect x="190" y="88" width="8" height="9"/><rect x="202" y="88" width="8" height="9"/><rect x="214" y="88" width="8" height="9"/><rect x="226" y="88" width="8" height="9"/>
      </g>
      <rect x="156" y="104" width="18" height="34" rx="2" fill="#cbaa7a"/>
      <rect x="226" y="104" width="18" height="34" rx="2" fill="#cbaa7a"/>
      <g fill="#cbaa7a"><rect x="154" y="98" width="7" height="7"/><rect x="164" y="98" width="7" height="7"/><rect x="224" y="98" width="7" height="7"/><rect x="234" y="98" width="7" height="7"/></g>
      <rect x="192" y="112" width="14" height="24" rx="7" fill="#7a5a38"/>
      <rect x="174" y="106" width="6" height="8" fill="#8a6a44"/>
      <rect x="220" y="106" width="6" height="8" fill="#8a6a44"/>
      <line x1="200" y1="88" x2="200" y2="68" stroke="#6b4f30" stroke-width="2"/>
      <path d="M200 68 L222 73 L200 79 Z" fill="#b8862b"/>
    </g>
    <path d="M168 136 L150 152 L246 152 L232 136 Z" fill="#a87c50"/>
    <path d="M150 152 L142 158 H256 L246 152 Z" fill="#8a6240"/>
    <g fill="#3f6e3a">
      <rect x="70" y="210" width="4" height="30" fill="#6b4f30"/><ellipse cx="72" cy="206" rx="13" ry="5"/><ellipse cx="63" cy="211" rx="10" ry="4" transform="rotate(-30 63 211)"/><ellipse cx="81" cy="211" rx="10" ry="4" transform="rotate(30 81 211)"/><ellipse cx="72" cy="200" rx="8" ry="4"/>
      <rect x="100" y="216" width="4" height="26" fill="#6b4f30"/><ellipse cx="102" cy="212" rx="11" ry="4"/><ellipse cx="94" cy="217" rx="8" ry="3" transform="rotate(-30 94 217)"/><ellipse cx="110" cy="217" rx="8" ry="3" transform="rotate(30 110 217)"/>
      <rect x="300" y="212" width="4" height="28" fill="#6b4f30"/><ellipse cx="302" cy="208" rx="12" ry="5"/><ellipse cx="293" cy="213" rx="9" ry="4" transform="rotate(-30 293 213)"/><ellipse cx="311" cy="213" rx="9" ry="4" transform="rotate(30 311 213)"/>
      <rect x="330" y="218" width="4" height="24" fill="#6b4f30"/><ellipse cx="332" cy="214" rx="10" ry="4"/><ellipse cx="324" cy="219" rx="8" ry="3" transform="rotate(-30 324 219)"/><ellipse cx="340" cy="219" rx="8" ry="3" transform="rotate(30 340 219)"/>
    </g>
    <path d="M0 238 Q200 226 400 238 V260 H0 Z" fill="#c9a76e"/>
    <g fill="#b8925a"><ellipse cx="50" cy="248" rx="9" ry="3"/><ellipse cx="170" cy="252" rx="11" ry="3"/><ellipse cx="290" cy="246" rx="8" ry="3"/><ellipse cx="360" cy="252" rx="10" ry="3"/></g>
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
