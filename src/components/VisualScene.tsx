import { useEffect, useRef } from 'react'
import { CIV_ILLUSTRATIONS } from '../illustrations'

/* =====================================================================
   The UAE Heritage — our extra section on the home page.

   It keeps the desert artwork (sun, clouds, camels, palms) but presents
   it the way the supervisor's site presents content: a full-width strip
   followed by the same `.civ-card` grid used for the civilizations.
   ===================================================================== */

function Cloud({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`absolute ${className}`} style={style}>
      <svg viewBox="0 0 200 80" fill="white" xmlns="http://www.w3.org/2000/svg">
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
    <div className="absolute top-6 right-[12%] z-10">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
        <div
          className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-400 animate-pulse"
          style={{ animationDuration: '4s' }}
        />
        <div className="absolute inset-0 rounded-full bg-yellow-300/40 blur-xl" style={{ transform: 'scale(2.2)' }} />
        <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-2xl" style={{ transform: 'scale(3)' }} />
      </div>
    </div>
  )
}

function Camel({ x, bottom, scale = 0.5 }: { x: number; bottom: number; scale?: number }) {
  return (
    <div
      className="absolute z-20 animate-float"
      style={{
        left: `${x}%`,
        bottom: `${bottom}%`,
        transform: `scale(${scale})`,
        transformOrigin: 'bottom left',
        animationDuration: '6s',
        animationDelay: `${(x % 7) * 0.6}s`,
        pointerEvents: 'none',
      }}
    >
      <svg width="140" height="130" viewBox="0 0 140 130" fill="none" xmlns="http://www.w3.org/2000/svg">
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

function PalmTree({ x, bottom = 26, size = 1 }: { x: number; bottom?: number; size?: number }) {
  return (
    <div
      className="absolute z-10"
      style={{ left: `${x}%`, bottom: `${bottom}%`, pointerEvents: 'none' }}
    >
      <svg
        width={70 * size}
        height={120 * size}
        viewBox="0 0 80 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
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

const UAE_SITES = [
  {
    id: 'khorfakkan',
    name: 'Khor Fakkan Fort',
    era: '16th century',
    blurb: 'A Portuguese coastal fort above the Gulf of Oman, built to guard the anchorage and the trade road inland.',
    accent: '#23466b',
  },
  {
    id: 'al-jazirat-al-hamra',
    name: 'Al-Jazirat Al-Hamra',
    era: 'Several centuries',
    blurb: 'A pearl-diving village of coral-stone houses, wind towers and narrow lanes on the Ras Al Khaimah coast.',
    accent: '#2f6b55',
  },
  {
    id: 'dhayah-fort',
    name: 'Dhayah Fort',
    era: '18th century',
    blurb: 'A hilltop fortress above the palm gardens of Ras Al Khaimah, the last stand against the British in 1819.',
    accent: '#b8862b',
  },
]

export default function VisualScene({ onSelectCiv }: { onSelectCiv: (id: string) => void }) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add('animate-visible')
        })
      },
      { threshold: 0.1 },
    )

    const els = sectionRef.current?.querySelectorAll('.animate-on-scroll')
    els?.forEach((el) => observer.observe(el))
    return () => els?.forEach((el) => observer.unobserve(el))
  }, [])

  return (
    <section className="section" id="uae-heritage" ref={sectionRef}>
      <div className="container">
        <div className="section-title">
          <div>
            <span className="eyebrow">Discover</span>
            <h2>The UAE Heritage</h2>
          </div>
          <a className="btn btn-outline btn-sm" href="#/civilizations">
            All civilizations
          </a>
        </div>
        <p className="lead" style={{ marginBottom: 0 }}>
          From the Portuguese fort at Khor Fakkan to the wind-tower houses of Al-Jazirat Al-Hamra
          and the hilltop defences of Dhayah, the Emirates keep a deep record of trade, pearl diving
          and desert life. Choose a site below to explore it in 3D.
        </p>

        {/* Decorative desert strip — sun, clouds, camels and palms */}
        <div className="uae-strip" aria-hidden="true">
          <div className="uae-strip-sky" />

          <Cloud className="w-28 sm:w-36 opacity-80" style={{ top: '10%', left: '6%', animation: 'drift 34s linear infinite' }} />
          <Cloud className="w-20 sm:w-28 opacity-60" style={{ top: '26%', left: '38%', animation: 'drift 44s linear infinite', animationDelay: '-14s' }} />
          <Cloud className="w-24 sm:w-32 opacity-50" style={{ top: '6%', right: '32%', animation: 'drift 38s linear infinite', animationDelay: '-22s' }} />

          <Sun />

          <div className="uae-strip-ground">
            <svg className="uae-strip-dunes" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path
                d="M0 60 Q150 18 300 48 Q450 78 600 38 Q750 -2 900 48 Q1050 98 1200 58 L1200 120 L0 120 Z"
                fill="#e8c47a"
                opacity="0.85"
              />
              <path
                d="M0 84 Q200 44 400 72 Q600 100 800 62 Q1000 24 1200 82 L1200 120 L0 120 Z"
                fill="#cf9c45"
                opacity="0.7"
              />
            </svg>
          </div>

          <PalmTree x={4} bottom={24} size={1.15} />
          <PalmTree x={16} bottom={26} size={0.85} />
          <PalmTree x={78} bottom={25} size={1.05} />
          <PalmTree x={90} bottom={23} size={0.8} />

          <Camel x={28} bottom={14} scale={0.5} />
          <Camel x={36} bottom={9} scale={0.62} />
          <Camel x={50} bottom={12} scale={0.46} />
          <Camel x={58} bottom={7} scale={0.56} />
          <Camel x={68} bottom={11} scale={0.4} />
        </div>

        {/* The three Emirati sites, in the same card language as the civ grid */}
        <div className="civ-grid" style={{ marginTop: 28 }}>
          {UAE_SITES.map((site) => (
            <article
              key={site.id}
              className="civ-card animate-on-scroll"
              style={{ '--accent': site.accent } as React.CSSProperties}
            >
              <div
                className="art"
                dangerouslySetInnerHTML={{ __html: CIV_ILLUSTRATIONS[site.id](`uae-${site.id}`) }}
              />
              <div className="body">
                <span className="era">{site.era}</span>
                <h3>{site.name}</h3>
                <p>{site.blurb}</p>
                <div className="actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => onSelectCiv(site.id)}
                  >
                    <svg viewBox="0 0 24 24">
                      <path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <path d="M3.3 7 12 12l8.7-5M12 22V12" />
                    </svg>
                    View in 3D
                  </button>
                  <a className="btn btn-outline btn-sm" href={`#/civ/${site.id}/info/overview`}>
                    Learn more
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
