import { useEffect, useRef } from 'react'

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
    <div className="absolute top-8 right-[15%] z-10">
      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-200 via-amber-300 to-orange-400 animate-pulse" style={{ animationDuration: '3s' }} />
        <div className="absolute inset-0 rounded-full bg-yellow-300/40 blur-xl" style={{ transform: 'scale(2.5)' }} />
        <div className="absolute inset-0 rounded-full bg-orange-400/20 blur-2xl" style={{ transform: 'scale(3.5)' }} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <div
            key={deg}
            className="absolute top-1/2 left-1/2 w-1.5 h-10 bg-gradient-to-b from-yellow-300/60 to-transparent rounded-full"
            style={{
              transformOrigin: 'center top',
              transform: `translate(-50%, 0) rotate(${deg}deg)`,
              height: '50px',
            }}
          />
        ))}
        <svg className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)]" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.3" strokeDasharray="4 6" />
        </svg>
      </div>
    </div>
  )
}

function Camel() {
  return (
    <div className="absolute bottom-[22%] right-[18%] z-20 animate-float" style={{ animationDuration: '4s' }}>
      <svg width="180" height="140" viewBox="0 0 180 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Body */}
        <ellipse cx="95" cy="80" rx="48" ry="28" fill="#8B6914" />
        <ellipse cx="95" cy="78" rx="44" ry="24" fill="#A0791A" />
        {/* Hump */}
        <ellipse cx="80" cy="58" rx="20" ry="16" fill="#8B6914" />
        <ellipse cx="80" cy="56" rx="17" ry="13" fill="#A0791A" />
        <ellipse cx="80" cy="54" rx="12" ry="9" fill="#B8922A" />
        {/* Neck */}
        <path d="M138 68 Q145 40 148 20 Q150 14 146 12 Q142 10 140 16 L135 55" fill="#8B6914" />
        <path d="M140 62 Q146 38 148 22 Q149 16 145 15 L138 55" fill="#A0791A" />
        {/* Head */}
        <ellipse cx="148" cy="12" rx="14" ry="9" fill="#8B6914" transform="rotate(-15 148 12)" />
        <ellipse cx="149" cy="11" rx="12" ry="7" fill="#A0791A" transform="rotate(-15 149 11)" />
        {/* Eye */}
        <circle cx="154" cy="8" r="2" fill="#2D1B00" />
        <circle cx="154.5" cy="7.5" r="0.7" fill="white" />
        {/* Mouth */}
        <path d="M157 13 Q160 14 159 16" stroke="#5C3A00" strokeWidth="1" fill="none" />
        {/* Front legs */}
        <line x1="120" y1="100" x2="125" y2="132" stroke="#7A5C10" strokeWidth="6" strokeLinecap="round" />
        <line x1="115" y1="102" x2="118" y2="132" stroke="#7A5C10" strokeWidth="6" strokeLinecap="round" />
        {/* Back legs */}
        <line x1="72" y1="100" x2="70" y2="132" stroke="#7A5C10" strokeWidth="6" strokeLinecap="round" />
        <line x1="65" y1="98" x2="62" y2="132" stroke="#7A5C10" strokeWidth="6" strokeLinecap="round" />
        {/* Hooves */}
        <ellipse cx="125" cy="134" rx="4" ry="2" fill="#3D2B00" />
        <ellipse cx="118" cy="134" rx="4" ry="2" fill="#3D2B00" />
        <ellipse cx="70" cy="134" rx="4" ry="2" fill="#3D2B00" />
        <ellipse cx="62" cy="134" rx="4" ry="2" fill="#3D2B00" />
        {/* Tail */}
        <path d="M48 75 Q35 72 30 78 Q28 82 32 84" stroke="#7A5C10" strokeWidth="2" fill="none" />
        <ellipse cx="31" cy="84" rx="4" ry="6" fill="#7A5C10" />
        {/* Saddle cloth */}
        <path d="M68 52 Q80 48 100 50 Q110 52 115 58 L110 65 Q95 60 75 60 Z" fill="#C85A30" opacity="0.7" />
        <path d="M72 54 Q82 50 98 51 Q108 53 112 57" stroke="#E8A020" strokeWidth="1" fill="none" />
      </svg>
    </div>
  )
}

function UAEIcon({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 cursor-pointer"
    >
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center group-hover:from-amber-500/30 group-hover:to-orange-500/30 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-all duration-300">
        {icon}
      </div>
      <span className="text-white/80 text-xs sm:text-sm font-medium group-hover:text-amber-300 transition-colors text-center leading-tight max-w-[90px]">{label}</span>
    </button>
  )
}

function GlobalCivSymbol({ children, label, color }: { children: React.ReactNode; label: string; color: string }) {
  return (
    <div className="group flex flex-col items-center gap-3">
      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl ${color} flex items-center justify-center group-hover:scale-110 transition-all duration-300 group-hover:shadow-xl`}>
        {children}
      </div>
      <span className="text-gray-300 text-xs sm:text-sm font-medium group-hover:text-white transition-colors text-center">{label}</span>
    </div>
  )
}

export default function VisualScene({ onSelectCiv }: { onSelectCiv: (id: string) => void }) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    const els = sectionRef.current?.querySelectorAll('.animate-on-scroll')
    els?.forEach((el) => observer.observe(el))
    return () => els?.forEach((el) => observer.unobserve(el))
  }, [])

  return (
    <div ref={sectionRef}>
      {/* ═══════════ SECTION 1: GLOBAL CIVILIZATIONS ═══════════ */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#0f0f0f]" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-[10%] w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-[10%] w-80 h-80 bg-rose-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 animate-on-scroll" style={{ opacity: 0, animation: 'fade-in-up 0.8s ease forwards' }}>
            <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">Our World, Our Heritage</p>
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              Global Civilizations
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg">
              From the banks of the Nile to the jungles of Mesoamerica, humanity has built extraordinary civilizations. Explore their wonders.
            </p>
          </div>

          {/* World Map Style Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8 mb-16">
            <div className="animate-on-scroll" style={{ opacity: 0, animation: 'fade-in-up 0.6s ease 0.1s forwards' }}>
              <GlobalCivSymbol label="Ancient Egypt" color="bg-gradient-to-br from-amber-500/15 to-yellow-500/10 border border-amber-500/20 hover:border-amber-500/40">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="24,4 4,40 44,40" />
                  <line x1="24" y1="4" x2="24" y2="40" opacity="0.3" />
                  <line x1="14" y1="40" x2="34" y2="40" />
                  <circle cx="24" cy="22" r="4" opacity="0.4" />
                </svg>
              </GlobalCivSymbol>
            </div>

            <div className="animate-on-scroll" style={{ opacity: 0, animation: 'fade-in-up 0.6s ease 0.2s forwards' }}>
              <GlobalCivSymbol label="Ancient Rome" color="bg-gradient-to-br from-sky-500/15 to-blue-500/10 border border-sky-500/20 hover:border-sky-500/40">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-sky-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="6" y="16" width="36" height="24" rx="2" />
                  <path d="M6 16 L24 6 L42 16" />
                  <line x1="12" y1="16" x2="12" y2="40" />
                  <line x1="20" y1="16" x2="20" y2="40" />
                  <line x1="28" y1="16" x2="28" y2="40" />
                  <line x1="36" y1="16" x2="36" y2="40" />
                  <path d="M10 28 Q16 22 24 28 Q32 22 38 28" strokeWidth="1" />
                </svg>
              </GlobalCivSymbol>
            </div>

            <div className="animate-on-scroll" style={{ opacity: 0, animation: 'fade-in-up 0.6s ease 0.3s forwards' }}>
              <GlobalCivSymbol label="Maya Civilization" color="bg-gradient-to-br from-emerald-500/15 to-green-500/10 border border-emerald-500/20 hover:border-emerald-500/40">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="12" y="36" width="24" height="4" />
                  <rect x="15" y="30" width="18" height="6" />
                  <rect x="18" y="24" width="12" height="6" />
                  <rect x="21" y="18" width="6" height="6" />
                  <line x1="24" y1="10" x2="24" y2="18" />
                  <circle cx="24" cy="8" r="3" />
                  <path d="M16 40 L12 44" strokeWidth="1" />
                  <path d="M32 40 L36 44" strokeWidth="1" />
                </svg>
              </GlobalCivSymbol>
            </div>

            <div className="animate-on-scroll" style={{ opacity: 0, animation: 'fade-in-up 0.6s ease 0.4s forwards' }}>
              <GlobalCivSymbol label="Taj Mahal" color="bg-gradient-to-br from-rose-500/15 to-pink-500/10 border border-rose-500/20 hover:border-rose-500/40">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="10" y="28" width="28" height="12" rx="1" />
                  <path d="M14 28 Q24 8 34 28" />
                  <circle cx="24" cy="18" r="2" />
                  <rect x="8" y="18" width="4" height="22" rx="1" />
                  <rect x="36" y="18" width="4" height="22" rx="1" />
                  <ellipse cx="24" cy="12" rx="1.5" ry="3" />
                  <line x1="18" y1="32" x2="18" y2="36" opacity="0.4" />
                  <line x1="30" y1="32" x2="30" y2="36" opacity="0.4" />
                </svg>
              </GlobalCivSymbol>
            </div>

            <div className="animate-on-scroll" style={{ opacity: 0, animation: 'fade-in-up 0.6s ease 0.5s forwards' }}>
              <GlobalCivSymbol label="Petra" color="bg-gradient-to-br from-orange-500/15 to-red-500/10 border border-orange-500/20 hover:border-orange-500/40">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-orange-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 44 L8 12 L24 4 L40 12 L40 44" />
                  <path d="M16 44 L16 28 L24 20 L32 28 L32 44" />
                  <circle cx="24" cy="14" r="3" />
                  <line x1="8" y1="24" x2="16" y2="24" opacity="0.3" />
                  <line x1="32" y1="24" x2="40" y2="24" opacity="0.3" />
                  <path d="M18 36 L24 30 L30 36" strokeWidth="1" />
                </svg>
              </GlobalCivSymbol>
            </div>
          </div>

          {/* Decorative connecting line */}
          <div className="hidden sm:block relative h-px max-w-3xl mx-auto mb-16">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            <div className="absolute left-1/2 -translate-x-1/2 -top-3 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
          </div>

          {/* Exploration cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[
              { id: 'egypt', title: 'Ancient Egypt', desc: 'Pyramids, pharaohs, and the secrets of the afterlife along the Nile.', icon: '▲', color: 'from-amber-500/10 to-amber-500/5 border-amber-500/20 hover:border-amber-500/40' },
              { id: 'rome', title: 'Ancient Rome', desc: 'Engineering marvels, law, and empire that shaped the Western world.', icon: '⬡', color: 'from-sky-500/10 to-sky-500/5 border-sky-500/20 hover:border-sky-500/40' },
              { id: 'maya', title: 'Maya Civilization', desc: 'Rainforest cities, advanced mathematics, and celestial calendars.', icon: '◆', color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40' },
              { id: 'taj-mahal', title: 'Taj Mahal', desc: 'The crown jewel of Mughal architecture and eternal love.', icon: '❋', color: 'from-rose-500/10 to-rose-500/5 border-rose-500/20 hover:border-rose-500/40' },
              { id: 'petra', title: 'Petra', desc: 'The rose-red city carved into cliff faces by the Nabateans.', icon: '◇', color: 'from-orange-500/10 to-orange-500/5 border-orange-500/20 hover:border-orange-500/40' },
            ].map((civ, i) => (
              <button
                key={civ.id}
                onClick={() => onSelectCiv(civ.id)}
                className={`animate-on-scroll text-left p-5 sm:p-6 rounded-2xl border bg-gradient-to-br ${civ.color} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer`}
                style={{ opacity: 0, animation: `fade-in-up 0.6s ease ${0.1 + i * 0.1}s forwards` }}
              >
                <div className="text-2xl mb-2 opacity-60 group-hover:opacity-100 transition-opacity">{civ.icon}</div>
                <h3 className="text-white font-bold text-base sm:text-lg mb-1 group-hover:text-amber-300 transition-colors">{civ.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{civ.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TRANSITION ═══════════ */}
      <div className="relative h-48 sm:h-64 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f0f] via-[#1a1206] to-[#d4a54a]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center z-10 px-4">
            <p className="text-amber-300/60 text-xs sm:text-sm tracking-[0.3em] uppercase mb-2">Discover</p>
            <h3 className="text-2xl sm:text-4xl font-black text-white/90" style={{ fontFamily: "'Playfair Display', serif" }}>
              The UAE Heritage
            </h3>
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-amber-400/50" />
              <svg className="w-4 h-4 text-amber-400/60 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-amber-400/50" />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ SECTION 2: UAE DESERT SCENE ═══════════ */}
      <section className="relative overflow-hidden">
        {/* Sky */}
        <div className="relative min-h-[85vh] sm:min-h-screen">
          {/* Sky gradient */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, #1a6dd4 0%, #3a8feb 25%, #6ab4f5 45%, #a8d8f8 60%, #e8d5a0 75%, #d4a54a 85%, #c4903a 100%)'
          }} />

          {/* Clouds */}
          <Cloud className="w-40 sm:w-56 opacity-70" style={{ top: '8%', left: '5%', animation: 'drift 25s linear infinite' }} />
          <Cloud className="w-32 sm:w-44 opacity-60" style={{ top: '15%', left: '35%', animation: 'drift 30s linear infinite', animationDelay: '-8s' }} />
          <Cloud className="w-48 sm:w-64 opacity-50" style={{ top: '5%', right: '25%', animation: 'drift 35s linear infinite', animationDelay: '-15s' }} />
          <Cloud className="w-28 sm:w-36 opacity-65" style={{ top: '20%', right: '10%', animation: 'drift 28s linear infinite', animationDelay: '-5s' }} />
          <Cloud className="w-36 sm:w-48 opacity-55" style={{ top: '12%', left: '55%', animation: 'drift 32s linear infinite', animationDelay: '-20s' }} />

          <Sun />

          {/* Camel */}
          <Camel />

          {/* Desert ground */}
          <div className="absolute bottom-0 left-0 right-0 h-[35%]" style={{
            background: 'linear-gradient(180deg, #d4a54a 0%, #c4903a 30%, #b8812e 60%, #a06c20 100%)'
          }}>
            {/* Sand dunes */}
            <svg className="absolute top-0 left-0 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none" style={{ transform: 'translateY(-60px)' }}>
              <path d="M0 60 Q150 20 300 50 Q450 80 600 40 Q750 0 900 50 Q1050 100 1200 60 L1200 120 L0 120 Z" fill="#d4a54a" opacity="0.6" />
              <path d="M0 80 Q200 40 400 70 Q600 100 800 60 Q1000 20 1200 80 L1200 120 L0 120 Z" fill="#c4903a" opacity="0.5" />
            </svg>
            {/* Sand texture dots */}
            <div className="absolute inset-0 opacity-20">
              {Array.from({ length: 30 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-amber-700/40"
                  style={{
                    left: `${(i * 37 + 13) % 100}%`,
                    top: `${(i * 23 + 7) % 80}%`,
                  }}
                />
              ))}
            </div>
          </div>

          {/* UAE Site Icons */}
          <div className="absolute bottom-[12%] sm:bottom-[15%] left-0 right-0 z-30">
            <div className="max-w-4xl mx-auto px-4">
              <div className="bg-gradient-to-r from-amber-900/40 via-amber-800/50 to-amber-900/40 backdrop-blur-sm rounded-2xl border border-amber-500/20 p-6 sm:p-8">
                <p className="text-center text-amber-200/80 text-xs sm:text-sm tracking-widest uppercase mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Explore UAE Historical Sites
                </p>
                <div className="flex justify-center gap-6 sm:gap-10 flex-wrap">
                  <UAEIcon
                    label="Khor Fakkan Fort"
                    onClick={() => onSelectCiv('khorfakkan')}
                    icon={
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="6" y="16" width="28" height="20" rx="1" />
                        <rect x="10" y="12" width="4" height="4" />
                        <rect x="18" y="12" width="4" height="4" />
                        <rect x="26" y="12" width="4" height="4" />
                        <rect x="15" y="24" width="10" height="12" rx="5" />
                        <line x1="6" y1="12" x2="34" y2="12" />
                      </svg>
                    }
                  />
                  <UAEIcon
                    label="Al-Jazirat Al-Hamra"
                    onClick={() => onSelectCiv('al-jazirat-al-hamra')}
                    icon={
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="4" y="18" width="14" height="18" rx="1" />
                        <rect x="22" y="14" width="14" height="22" rx="1" />
                        <rect x="8" y="22" width="3" height="4" opacity="0.5" />
                        <rect x="13" y="22" width="3" height="4" opacity="0.5" />
                        <rect x="26" y="18" width="3" height="4" opacity="0.5" />
                        <rect x="31" y="18" width="3" height="4" opacity="0.5" />
                        <rect x="26" y="26" width="3" height="4" opacity="0.5" />
                        <rect x="31" y="26" width="3" height="4" opacity="0.5" />
                        <line x1="11" y1="14" x2="11" y2="8" strokeWidth="1" />
                        <polygon points="11,8 9,11 13,11" fill="currentColor" opacity="0.3" />
                      </svg>
                    }
                  />
                  <UAEIcon
                    label="Dhayah Fort"
                    onClick={() => onSelectCiv('dhayah-fort')}
                    icon={
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-amber-300" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 38 L8 14 L20 6 L32 14 L32 38" />
                        <rect x="15" y="22" width="10" height="16" rx="5" />
                        <rect x="10" y="18" width="4" height="4" opacity="0.5" />
                        <rect x="26" y="18" width="4" height="4" opacity="0.5" />
                        <line x1="20" y1="6" x2="20" y2="2" />
                        <polygon points="20,2 18,5 22,5" fill="currentColor" opacity="0.4" />
                      </svg>
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom gradient into page bg */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0f0f0f] to-transparent z-40" />
        </div>
      </section>
    </div>
  )
}
