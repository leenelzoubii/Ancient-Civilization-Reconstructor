import type { CSSProperties } from 'react'
import { CIV_ILLUSTRATIONS } from '../illustrations'

/* =====================================================================
   The UAE Heritage — our extra section on the home page.

   A desert panorama (sky, sun, clouds, dunes, camels and palms) followed
   by the three Emirati sites, presented with the same `.civ-card` grid the
   supervisor's site uses for the ancient civilizations.
   ===================================================================== */

const UAE_SITES = [
  {
    id: 'khorfakkan',
    name: 'Khor Fakkan Fort',
    era: '16th century · East coast',
    accent: '#23466b',
    text: 'A Portuguese-era fort of coral stone and round bastions, built to watch the trade routes through the Gulf of Oman.',
  },
  {
    id: 'al-jazirat-al-hamra',
    name: 'Al-Jazirat Al-Hamra',
    era: 'Pearl-diving village · Ras Al Khaimah',
    accent: '#a4502f',
    text: 'Courtyard houses and barjeel wind towers in a red-soil village that lived from pearling, fishing and the sea.',
  },
  {
    id: 'dhayah-fort',
    name: 'Dhayah Fort',
    era: '18th century · Ras Al Khaimah',
    accent: '#b8862b',
    text: "The UAE's only surviving hilltop fort, guarding the palm groves and coast from a rocky summit.",
  },
]

function Cloud({ style }: { style?: CSSProperties }) {
  return (
    <div className="uae-cloud" style={style} aria-hidden="true">
      <svg viewBox="0 0 200 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="60" cy="50" rx="60" ry="28" opacity="0.9" />
        <ellipse cx="110" cy="45" rx="50" ry="32" opacity="0.85" />
        <ellipse cx="85" cy="38" rx="40" ry="25" opacity="0.95" />
        <ellipse cx="140" cy="52" rx="45" ry="24" opacity="0.8" />
        <ellipse cx="40" cy="55" rx="35" ry="20" opacity="0.7" />
      </svg>
    </div>
  )
}

function Sun() {
  return (
    <div className="uae-sun" aria-hidden="true">
      <span className="uae-sun-core" />
      <span className="uae-sun-glow" />
      <span className="uae-sun-halo" />
    </div>
  )
}

function Camel({
  x,
  y,
  scale = 1,
  flip = false,
  delay = 0,
}: {
  x: number
  y: number
  scale?: number
  flip?: boolean
  delay?: number
}) {
  return (
    <div
      className="uae-camel"
      style={{
        left: `${x}%`,
        bottom: `${y}%`,
        width: 150 * scale,
        animationDelay: `${delay}s`,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 140 130"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={flip ? { transform: 'scaleX(-1)' } : undefined}
      >
        <ellipse cx="70" cy="65" rx="34" ry="20" fill="#8B6914" />
        <ellipse cx="70" cy="63" rx="30" ry="16" fill="#A0791A" />
        <ellipse cx="50" cy="48" rx="12" ry="10" fill="#8B6914" />
        <ellipse cx="50" cy="46" rx="9" ry="7" fill="#A0791A" />
        <ellipse cx="50" cy="44" rx="6" ry="5" fill="#B8922A" />
        <path d="M102 48 Q115 30 120 20 Q122 14 118 12 Q114 10 112 16 L108 55" fill="#8B6914" />
        <path d="M105 45 Q112 26 116 18 Q117 14 113 13 L108 55" fill="#A0791A" />
        <ellipse cx="118" cy="10" rx="11" ry="7" fill="#8B6914" transform="rotate(-12 118 10)" />
        <ellipse cx="119" cy="9" rx="9" ry="5" fill="#A0791A" transform="rotate(-12 119 9)" />
        <circle cx="124" cy="6" r="1.5" fill="#2D1B00" />
        <circle cx="124.5" cy="5.5" r="0.5" fill="white" />
        <path d="M132 8 Q135 9 134 11" stroke="#5C3A00" strokeWidth="1" fill="none" />
        <line x1="80" y1="80" x2="85" y2="115" stroke="#7A5C10" strokeWidth="5" strokeLinecap="round" />
        <line x1="75" y1="82" x2="78" y2="115" stroke="#7A5C10" strokeWidth="5" strokeLinecap="round" />
        <line x1="45" y1="80" x2="43" y2="115" stroke="#7A5C10" strokeWidth="5" strokeLinecap="round" />
        <line x1="38" y1="78" x2="35" y2="115" stroke="#7A5C10" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="85" cy="118" rx="3" ry="1.5" fill="#3D2B00" />
        <ellipse cx="78" cy="118" rx="3" ry="1.5" fill="#3D2B00" />
        <ellipse cx="43" cy="118" rx="3" ry="1.5" fill="#3D2B00" />
        <ellipse cx="35" cy="118" rx="3" ry="1.5" fill="#3D2B00" />
        <ellipse cx="70" cy="122" rx="40" ry="5" fill="#7A5C10" opacity="0.2" />
        <path d="M20 50 Q10 45 8 50 Q10 55 20 55" stroke="#7A5C10" strokeWidth="2" fill="none" />
        <ellipse cx="21" cy="55" rx="3" ry="5" fill="#7A5C10" />
        <path d="M40 36 Q52 32 72 34 Q82 36 87 44 L82 51 Q67 46 47 46 Z" fill="#C85A30" opacity="0.7" />
        <path d="M44 38 Q54 34 68 35 Q78 37 82 41" stroke="#E8A020" strokeWidth="1" fill="none" />
      </svg>
    </div>
  )
}

function PalmTree({ x, size = 1, bottom = 6 }: { x: number; size?: number; bottom?: number }) {
  return (
    <div
      className="uae-palm"
      style={{ left: `${x}%`, bottom: `${bottom}%`, width: 80 * size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 80 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M38 140 Q36 110 37 85 Q38 65 40 50" stroke="#8B6514" strokeWidth="7" strokeLinecap="round" fill="none" />
        <path d="M39 140 Q37 110 38 85 Q39 65 41 50" stroke="#A0791A" strokeWidth="4" strokeLinecap="round" fill="none" />
        <line x1="36" y1="120" x2="42" y2="120" stroke="#6B4E0D" strokeWidth="1" opacity="0.5" />
        <line x1="36" y1="105" x2="42" y2="105" stroke="#6B4E0D" strokeWidth="1" opacity="0.5" />
        <line x1="37" y1="90" x2="43" y2="90" stroke="#6B4E0D" strokeWidth="1" opacity="0.5" />
        <line x1="37" y1="75" x2="43" y2="75" stroke="#6B4E0D" strokeWidth="1" opacity="0.5" />
        <line x1="38" y1="60" x2="44" y2="60" stroke="#6B4E0D" strokeWidth="1" opacity="0.5" />
        <path d="M40 50 Q25 35 5 30" stroke="#2D7A2D" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M40 50 Q28 38 8 40" stroke="#3A8F3A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M40 50 Q55 35 75 30" stroke="#2D7A2D" strokeWidth="4" strokeLinecap="round" fill="none" />
        <path d="M40 50 Q52 38 72 40" stroke="#3A8F3A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M40 50 Q30 30 20 15" stroke="#3A8F3A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M40 50 Q50 30 60 15" stroke="#3A8F3A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        <path d="M40 50 Q38 28 40 10" stroke="#2D7A2D" strokeWidth="4" strokeLinecap="round" fill="none" />
        <circle cx="36" cy="52" r="4" fill="#5C4033" />
        <circle cx="44" cy="53" r="3.5" fill="#6B4E3D" />
        <circle cx="40" cy="56" r="3.5" fill="#5C4033" />
        <ellipse cx="40" cy="138" rx="18" ry="4" fill="#7A5C10" opacity="0.2" />
      </svg>
    </div>
  )
}

function Dunes() {
  return (
    <svg className="uae-dunes" viewBox="0 0 1200 170" preserveAspectRatio="none" aria-hidden="true">
      <path
        d="M0 84 Q150 30 300 62 Q450 94 600 48 Q750 6 900 58 Q1050 110 1200 70 L1200 170 L0 170 Z"
        fill="#dcb268"
        opacity="0.8"
      />
      <path
        d="M0 112 Q200 64 400 94 Q600 124 800 80 Q1000 36 1200 98 L1200 170 L0 170 Z"
        fill="#c18c39"
        opacity="0.75"
      />
    </svg>
  )
}

export default function VisualScene({ onSelectCiv }: { onSelectCiv: (id: string) => void }) {
  return (
    <section className="uae-section" id="uae-heritage" aria-labelledby="uae-title">
      <div className="container">
        <div className="section-title">
          <div>
            <span className="eyebrow">UAE heritage</span>
            <h2 id="uae-title">Our own desert, camels and coastal forts</h2>
            <p className="section-lead">
              Long before the skyscrapers, the Emirates were a land of pearl divers, camel caravans,
              palm groves and watchtowers. Three of those places are reconstructed in 3D below.
            </p>
          </div>
          <a className="btn btn-outline btn-sm" href="#/civilizations">
            All eight sites
          </a>
        </div>
      </div>

      <div className="uae-panorama" aria-hidden="true">
        <div className="uae-sky" />
        <Sun />
        <Cloud style={{ top: '8%', left: '4%', width: 'clamp(90px, 14vw, 170px)', animationDelay: '-4s' }} />
        <Cloud style={{ top: '16%', left: '32%', width: 'clamp(70px, 11vw, 140px)', animationDelay: '-16s' }} />
        <Cloud style={{ top: '5%', right: '24%', width: 'clamp(110px, 17vw, 200px)', animationDelay: '-10s' }} />
        <Cloud style={{ top: '21%', right: '8%', width: 'clamp(60px, 9vw, 120px)', animationDelay: '-22s' }} />
        <Dunes />
        <div className="uae-sand" />

        <Camel x={3} y={13} scale={0.62} delay={0.2} />
        <Camel x={13} y={17} scale={0.52} flip delay={1.4} />
        <Camel x={22} y={12} scale={0.58} delay={2.1} />
        <Camel x={31} y={16} scale={0.48} flip delay={0.8} />
        <Camel x={39} y={11} scale={0.6} delay={2.8} />
        <Camel x={48} y={15} scale={0.5} flip delay={1.9} />
        <Camel x={56} y={10} scale={0.64} delay={0.4} />
        <Camel x={65} y={14} scale={0.54} flip delay={2.5} />
        <Camel x={73} y={11} scale={0.58} delay={1.1} />
        <Camel x={81} y={16} scale={0.5} flip delay={3.1} />
        <Camel x={88} y={12} scale={0.6} delay={0.6} />
        <Camel x={94} y={17} scale={0.46} flip delay={2.2} />

        <PalmTree x={6} size={1.05} bottom={9} />
        <PalmTree x={27} size={0.8} bottom={7} />
        <PalmTree x={52} size={1.15} bottom={8} />
        <PalmTree x={74} size={0.85} bottom={6} />
        <PalmTree x={92} size={1} bottom={9} />
      </div>

      <div className="container">
        <div className="civ-grid uae-sites">
          {UAE_SITES.map((site) => {
            const art = CIV_ILLUSTRATIONS[site.id]
            return (
              <article
                className="civ-card"
                key={site.id}
                style={{ '--accent': site.accent } as CSSProperties}
              >
                <div className="art">{art ? <span dangerouslySetInnerHTML={{ __html: art('uae') }} /> : null}</div>
                <div className="body">
                  <span className="era">{site.era}</span>
                  <h3>{site.name}</h3>
                  <p>{site.text}</p>
                  <div className="actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onSelectCiv(site.id)}
                    >
                      View in 3D
                    </button>
                    <a className="btn btn-outline btn-sm" href={`#/civ/${site.id}/info/overview`}>
                      Learn more
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div className="uae-chips" aria-label="Themes of the UAE heritage section">
          <span>Desert &amp; oases</span>
          <span>Camel caravans</span>
          <span>Pearl diving</span>
          <span>Wind towers</span>
          <span>Hilltop forts</span>
          <span>Gulf trade routes</span>
        </div>
      </div>
    </section>
  )
}
