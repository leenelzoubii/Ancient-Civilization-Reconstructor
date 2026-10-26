import { useState, useEffect, useRef } from 'react'
import civilizations from '../data/civilizations.json'
import { CIV_ILLUSTRATIONS } from './illustrations'
import ArtifactRestorer from './pages/ArtifactRestorer'
import AboutPage from './pages/AboutPage'
import VisualScene from './components/VisualScene'
import AnimatedSection from './components/AnimatedSection'
import Flashcards from './components/Flashcards'
import WebGLViewer from './components/WebGLViewer'

const TAG_COLORS: Record<string, string> = {
  primary: 'bg-amber-500/20 text-accent border border-amber-500/30',
  secondary: 'bg-orange-500/20 text-accent-2 border border-orange-500/30',
  accent: 'bg-teal-500/20 text-cool border border-teal-500/30',
  info: 'bg-sky-500/20 text-cool-2 border border-sky-500/30',
}

const TAG_MAPS: Record<string, { label: string; color: string }[]> = {
  egypt: [
    { label: 'Pyramids', color: 'primary' },
    { label: 'Pharaohs', color: 'secondary' },
    { label: 'Nile River', color: 'accent' },
    { label: 'Mummification', color: 'info' },
  ],
  rome: [
    { label: 'Colosseum', color: 'primary' },
    { label: 'Roman Law', color: 'secondary' },
    { label: 'Engineering', color: 'accent' },
    { label: 'Empire', color: 'info' },
  ],
  maya: [
    { label: 'Calendar', color: 'primary' },
    { label: 'Mathematics', color: 'secondary' },
    { label: 'Rainforest', color: 'accent' },
    { label: 'Temples', color: 'info' },
  ],
  khorfakkan: [
    { label: 'Portuguese Fort', color: 'primary' },
    { label: 'Gulf Trade', color: 'secondary' },
    { label: 'Coastal Fortress', color: 'accent' },
    { label: '16th Century', color: 'info' },
  ],
  petra: [
    { label: 'Rock-Cut Architecture', color: 'primary' },
    { label: 'Nabatean', color: 'secondary' },
    { label: 'Desert City', color: 'accent' },
    { label: 'Water Management', color: 'info' },
  ],
  'al-jazirat-al-hamra': [
    { label: 'Pearl Diving', color: 'primary' },
    { label: 'Wind Towers', color: 'secondary' },
    { label: 'Courtyard House', color: 'accent' },
    { label: 'Gulf Coast', color: 'info' },
  ],
  'dhayah-fort': [
    { label: 'Hilltop Fort', color: 'primary' },
    { label: 'Al Qasimi', color: 'secondary' },
    { label: 'Defense', color: 'accent' },
    { label: 'UAE Heritage', color: 'info' },
  ],
  'taj-mahal': [
    { label: 'Mughal', color: 'primary' },
    { label: 'Agra', color: 'secondary' },
    { label: 'Marble', color: 'accent' },
    { label: 'Mausoleum', color: 'info' },
  ],
}

const CIV_ACCENTS: Record<string, string> = {
  egypt: '#b8862b',
  rome: '#a4502f',
  maya: '#2f6b55',
  'taj-mahal': '#d9a92e',
  khorfakkan: '#23466b',
  petra: '#a4502f',
  'al-jazirat-al-hamra': '#2f6b55',
  'dhayah-fort': '#b8862b',
}

const TABS = ['overview', 'history', 'culture', 'achievements', 'economy', 'daily-life', 'architecture', 'flashcards'] as const
type Tab = typeof TABS[number]

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  history: 'History',
  culture: 'Culture',
  achievements: 'Achievements',
  economy: 'Economy',
  'daily-life': 'Society & Daily Life',
  architecture: 'Architecture',
  flashcards: 'Flashcards',
}

function RichContent({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/).filter(Boolean)
  return (
    <div>
      {blocks.map((block, i) =>
        block.startsWith('## ') ? (
          <h3
            key={i}
            className="text-lg font-bold text-accent mt-6 mb-2 first:mt-0"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {block.slice(3)}
          </h3>
        ) : (
          <p key={i} className="text-ink-2 leading-relaxed text-base mb-4 last:mb-0">
            {block}
          </p>
        )
      )}
    </div>
  )
}

type Page = 'home' | 'detail' | 'restore' | 'about'

// ── NavBar (supervisor's site-header style) ────────────────────────────
function NavBar({
  page,
  onNavigate,
  theme,
  onToggleTheme,
}: {
  page: Page
  onNavigate: (p: Page) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}) {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <button onClick={() => onNavigate('home')} aria-label="ACR — Ancient Civilization Reconstructor — Home" className="brand">
          <img src="/logo/logo-light.png" alt="" className="brand-mark" />
          <span className="brand-text hidden sm:block">
            Ancient Civilization<br />Reconstructor
          </span>
        </button>
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('home')} className={`text-sm font-medium transition-colors cursor-pointer px-3.5 py-1.5 rounded-full ${page === 'home' ? 'bg-[#d9a92e] text-[#1d1a16] font-semibold' : 'text-[#e8dcc2] hover:bg-white/10 hover:text-white'}`}>
            Home
          </button>
          <button onClick={() => { onNavigate('home'); setTimeout(() => { document.getElementById('civilizations')?.scrollIntoView({ behavior: 'smooth' }) }, 100) }} className={`text-sm font-medium transition-colors cursor-pointer px-3.5 py-1.5 rounded-full ${page === 'home' ? 'text-[#e8dcc2] hover:bg-white/10 hover:text-white' : 'bg-[#d9a92e] text-[#1d1a16] font-semibold'}`}>
            Civilizations
          </button>
          <button onClick={() => onNavigate('restore')} className={`text-sm font-medium transition-colors cursor-pointer px-3.5 py-1.5 rounded-full ${page === 'restore' ? 'bg-[#d9a92e] text-[#1d1a16] font-semibold' : 'text-[#e8dcc2] hover:bg-white/10 hover:text-white'}`}>
            AI Restorer
          </button>
          <button onClick={() => onNavigate('about')} className={`text-sm font-medium transition-colors cursor-pointer px-3.5 py-1.5 rounded-full ${page === 'about' ? 'bg-[#d9a92e] text-[#1d1a16] font-semibold' : 'text-[#e8dcc2] hover:bg-white/10 hover:text-white'}`}>
            About
          </button>
          <button onClick={onToggleTheme} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Light mode' : 'Dark mode'} className="w-9 h-9 rounded-lg bg-panel-2 border border-line flex items-center justify-center text-accent hover:scale-110 hover:border-accent/40 transition-all cursor-pointer">
            {theme === 'dark' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

// ── HomePage ──────────────────────────────────────────────────────────
function HomePage({ onSelectCiv, onNavigate }: { onSelectCiv: (id: string) => void; onNavigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen bg-app flex flex-col">
      {/* Supervisor's hero section */}
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <span className="eyebrow">Explore · Learn · Reconstruct</span>
            <h1>Step inside the worlds of <em>ancient civilizations</em></h1>
            <p className="lead">Walk around digital reconstructions of Ancient Egypt, Rome and the Maya, discover how people lived, and use AI to imagine how broken artifacts once looked.</p>
            <div className="hero-actions">
              <button className="btn btn-gold" onClick={() => document.getElementById('civilizations')?.scrollIntoView({ behavior: 'smooth' })}>Explore now →</button>
              <button className="btn btn-light" onClick={() => onNavigate('restore')}>Reconstruct an artifact</button>
            </div>
            <div className="hero-stats">
              <div><strong>8</strong><span>Civilizations</span></div>
              <div><strong>16</strong><span>3D landmarks</span></div>
              <div><strong>4,800</strong><span>Years of history</span></div>
            </div>
          </div>
          <div className="hero-collage" aria-hidden="true">
            <figure className="c1">
              {CIV_ILLUSTRATIONS['egypt']('h1')}
              <figcaption>Giza, Egypt</figcaption>
            </figure>
            <figure className="c2">
              {CIV_ILLUSTRATIONS['rome']('h2')}
              <figcaption>Rome, Italy</figcaption>
            </figure>
            <figure className="c3">
              {CIV_ILLUSTRATIONS['maya']('h3')}
              <figcaption>Chichén Itzá, Mexico</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Civ grid section */}
      <section className="section" id="civilizations">
        <div className="container">
          <div className="section-title">
            <div>
              <span className="eyebrow">Choose a civilization</span>
              <h2>Where would you like to travel?</h2>
            </div>
          </div>
          <div className="civ-grid">
            {civilizations.civilizations.map((civ) => (
              <div key={civ.id} className="civ-card" style={{ '--accent': CIV_ACCENTS[civ.id] } as React.CSSProperties}>
                <div className="art">
                  {CIV_ILLUSTRATIONS[civ.id] ? CIV_ILLUSTRATIONS[civ.id](`card-${civ.id}`) : null}
                </div>
                <div className="body">
                  <span className="era">{civ.era}</span>
                  <h3>{civ.name}</h3>
                  <p>{civ.overview.slice(0, 80)}...</p>
                  <div className="actions">
                    <button onClick={() => onSelectCiv(civ.id)} className="btn btn-primary btn-sm">View in 3D</button>
                    <button onClick={() => { onSelectCiv(civ.id) }} className="btn btn-outline btn-sm">Learn more</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UAE Heritage section (VisualScene) */}
      <VisualScene onSelectCiv={onSelectCiv} />

      <section className="section">
        <div className="container">
          <div className="section-title">
            <div>
              <span className="eyebrow">How it works</span>
              <h2>Learning through reconstruction</h2>
            </div>
          </div>
          <div className="steps-row">
            {[
              { title: 'Choose', desc: 'Select a civilization — Ancient Egypt, Rome, the Maya, Taj Mahal, Petra, or the UAE heritage sites.' },
              { title: 'Explore in 3D', desc: 'Rotate and zoom around a reconstructed city and jump to its most important landmarks.' },
              { title: 'Learn', desc: 'Read about history, architecture, daily life and achievements, with timelines and key facts.' },
              { title: 'Reconstruct', desc: 'Upload a broken artifact and let the AI estimate how it looked when it was complete.' },
            ].map((s) => (
              <div key={s.title} className="step-card">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-title">
            <div>
              <span className="eyebrow">AI-Powered</span>
              <h2>Artifact Restoration</h2>
            </div>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="p-8 rounded-2xl border border-line bg-gradient-to-br from-white/[0.05] to-white/[0.02] hover:border-amber-500/20 hover:shadow-xl hover:shadow-amber-500/5 transition-all duration-500">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-ink">Paint &amp; Restore</h3>
              </div>
              <p className="text-ink-2 text-sm leading-relaxed">
                Upload a photo of a cracked or broken artifact, brush over the damaged areas yourself, and AI rebuilds exactly what you marked — every untouched pixel, including the background, stays exactly as uploaded.
              </p>
            </div>
          </div>
          <div className="text-center mt-10">
            <button onClick={() => onNavigate('restore')} className="btn btn-gold">
              Try AI Restorer
            </button>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <img className="footer-mark" src="/logo/logo-light.png" alt="" />
            <strong>ACR — Ancient Civilization Reconstructor</strong>
            <p>A Computing &amp; Artificial Intelligence capstone project — Applied Technology Schools, Baniyas Girls campus.</p>
          </div>
          <nav aria-label="Footer">
            <a href="#/civilizations">Civilizations</a>
            <a href="#/reconstruct">Reconstruct Artifact</a>
            <a href="#/about">About the project</a>
          </nav>
          <p className="footer-note">Reconstructions are educational estimates based on historical and archaeological references.</p>
        </div>
      </footer>
    </div>
  )
}

function DetailPage({ civId, onBack }: { civId: string; onBack: () => void }) {
  const civ = civilizations.civilizations.find(c => c.id === civId)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const sectionRef = useRef<HTMLDivElement>(null)
  const tags = TAG_MAPS[civId] || []

  if (!civ) return <div className="min-h-screen bg-app flex items-center justify-center text-ink">Civilization not found</div>

  const tabIndex = TABS.indexOf(activeTab)
  const prevTab = tabIndex > 0 ? TABS[tabIndex - 1] : null
  const nextTab = tabIndex < TABS.length - 1 ? TABS[tabIndex + 1] : null

  const goTab = (tab: Tab) => {
    setActiveTab(tab)
    requestAnimationFrame(() => {
      const el = sectionRef.current
      if (!el) return
      const y = el.getBoundingClientRect().top + window.scrollY - 70
      window.scrollTo({ top: y, behavior: 'smooth' })
    })
  }

  const tabContent: Record<Exclude<Tab, 'flashcards'>, string> = {
    overview: civ.overview,
    history: civ.history,
    culture: civ.culture,
    achievements: civ.achievements,
    economy: civ.economy,
    'daily-life': civ.dailyLife,
    architecture: civ.architecture,
  }

  const hasWebGLScene = ['egypt', 'rome', 'maya'].includes(civId)

  return (
    <div className="min-h-screen bg-app pt-16 flex flex-col">
      <div className="container">
        <div className="page-head">
          <button onClick={onBack} className="back flex items-center gap-2 cursor-pointer">
            ← Back to civilizations
          </button>
          <span className="eyebrow">{civ.name} · {civ.era}</span>
          <h1 style={{ margin: 0 }}>{civ.name}</h1>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, i) => (
            <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${TAG_COLORS[tag.color]}`}>
              {tag.label}
            </span>
          ))}
        </div>

        {CIV_ILLUSTRATIONS[civId] && (
          <div
            className="civ-banner mt-6 rounded-2xl overflow-hidden border border-line bg-panel"
            dangerouslySetInnerHTML={{ __html: CIV_ILLUSTRATIONS[civId](`banner-${civId}`) }}
          />
        )}

        <div className="view-layout">
          <div>
            <div className="viewer-wrap">
              <div className="viewer" id="viewer" style={{ background: '#e4c48a' }}>
                <div className="viewer-hint" id="hint">
                  {matchMedia('(pointer: coarse)').matches ? 'Drag to rotate · Pinch to zoom' : 'Drag to rotate · Scroll to zoom · Shift + drag to pan'}
                </div>
                {hasWebGLScene ? (
                  <WebGLViewer sceneId={civId as 'egypt' | 'rome' | 'maya'} accent={CIV_ACCENTS[civId]} />
                ) : (
                  <iframe
                    src={`https://sketchfab.com/models/${civ.sketchfabScene}/embed?autostart=0`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allow="autoplay; fullscreen; vr; xr-spatial-tracking"
                    title={`${civ.name} 3D Model`}
                  />
                )}
                <div className="viewer-ui" style={{ display: hasWebGLScene ? 'none' : 'flex' }} />
                <div className="viewer-title">{civ.name}</div>
              </div>
              <div className="poi-bar">
                <div className="poi-text" aria-live="polite">
                  <h3>Explore the reconstruction</h3>
                  <p>Use the arrows or markers to visit key landmarks. Drag the scene to look around.</p>
                  <div className="poi-dots" />
                </div>
              </div>
            </div>
          </div>
          <aside className="side-panel">
            <h3>Information</h3>
            <ul>
              {TABS.map(s => (
                <li key={s}>
                  <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab(s as Tab) }}>
                    {TAB_LABELS[s as Tab]}
                  </a>
                </li>
              ))}
            </ul>
            <dl>
              <div><dt>Period</dt><dd>{civ.era}</dd></div>
              <div><dt>Region</dt><dd>{civ.region}</dd></div>
              <div><dt>Major cities</dt><dd>{civ.capitals}</dd></div>
              <div><dt>Language</dt><dd>{civ.language}</dd></div>
            </dl>
          </aside>
        </div>

        <div ref={sectionRef} className="mt-8 animate-fade-in-up">
          <div className="flex flex-wrap gap-2 mb-0 border-b border-line pb-0">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium rounded-t-xl transition-all duration-300 cursor-pointer ${activeTab === tab ? 'bg-panel-2 text-accent border border-line border-b-transparent -mb-px' : 'text-ink-3 hover:text-ink-2 hover:bg-panel'}`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
          <div className="bg-panel border border-line border-t-0 rounded-b-2xl p-6 sm:p-8">
            {activeTab === 'flashcards' ? (
              <Flashcards key={civId} civId={civId} />
            ) : (
              <RichContent text={tabContent[activeTab as Exclude<Tab, 'flashcards'>]} />
            )}

            <div className="flex items-center justify-between gap-3 mt-8 pt-5 border-t border-line-soft">
              {prevTab ? (
                <button onClick={() => goTab(prevTab)} className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-panel-2 text-ink-2 text-sm font-medium hover:text-ink hover:border-accent/40 transition-all cursor-pointer">
                  ← {TAB_LABELS[prevTab]}
                </button>
              ) : (
                <span aria-hidden="true" />
              )}
              {nextTab ? (
                <button onClick={() => goTab(nextTab)} className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-line bg-panel-2 text-ink-2 text-sm font-medium hover:text-ink hover:border-accent/40 transition-all cursor-pointer">
                  {TAB_LABELS[nextTab]} →
                </button>
              ) : (
                <span aria-hidden="true" />
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <img className="footer-mark" src="/logo/logo-light.png" alt="" />
            <strong>ACR — Ancient Civilization Reconstructor</strong>
            <p>A Computing &amp; Artificial Intelligence capstone project — Applied Technology Schools, Baniyas Girls campus.</p>
          </div>
          <nav aria-label="Footer">
            <a href="#/civilizations">Civilizations</a>
            <a href="#/reconstruct">Reconstruct Artifact</a>
            <a href="#/about">About the project</a>
          </nav>
          <p className="footer-note">Reconstructions are educational estimates based on historical and archaeological references.</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedCiv, setSelectedCiv] = useState<string | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('acr-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return 'light'
  })

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('acr-theme', theme)
  }, [theme])

  const handleSelectCiv = (id: string) => {
    setSelectedCiv(id)
    setPage('detail')
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    setPage('home')
    setSelectedCiv(null)
  }

  const cursorDot = useRef<HTMLDivElement>(null)
  const cursorRing = useRef<HTMLDivElement>(null)
  const cursorGlow = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = cursorDot.current
    const ring = cursorRing.current
    const glow = cursorGlow.current
    if (!dot || !ring || !glow) return

    let mx = -200, my = -200
    let rx = -200, ry = -200
    let gx = -200, gy = -200
    let raf: number

    const move = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      dot.style.left = mx + 'px'
      dot.style.top = my + 'px'
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      glow.style.opacity = '1'
    }
    const leave = () => { dot.style.opacity = '0'; ring.style.opacity = '0'; glow.style.opacity = '0' }
    const enter = () => { dot.style.opacity = '1'; ring.style.opacity = '1'; glow.style.opacity = '1' }

    const tick = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      gx += (mx - gx) * 0.06
      gy += (my - gy) * 0.06
      ring.style.left = rx + 'px'
      ring.style.top = ry + 'px'
      glow.style.left = gx + 'px'
      glow.style.top = gy + 'px'
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', move)
    document.addEventListener('mouseleave', leave)
    document.addEventListener('mouseenter', enter)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', move)
      document.removeEventListener('mouseleave', leave)
      document.removeEventListener('mouseenter', enter)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div ref={cursorDot} style={{ position:'fixed', top:-100, left:-100, width:8, height:8, borderRadius:'50%', background:'linear-gradient(135deg,#d4af37,#e56b4f)', boxShadow:'0 0 12px rgba(212,175,55,0.8), 0 0 24px rgba(212,175,55,0.4)', pointerEvents:'none', zIndex:2147483647, transform:'translate(-50%,-50%)', opacity:0 }} />
      <div ref={cursorRing} style={{ position:'fixed', top:-100, left:-100, width:40, height:40, borderRadius:'50%', border:'1.5px solid rgba(212,175,55,0.5)', boxShadow:'0 0 15px rgba(212,175,55,0.15)', pointerEvents:'none', zIndex:2147483646, transform:'translate(-50%,-50%)', opacity:0 }} />
      <div ref={cursorGlow} style={{ position:'fixed', top:-100, left:-100, width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle,rgba(212,175,55,0.12) 0%,rgba(229,107,79,0.06) 40%,transparent 70%)', pointerEvents:'none', zIndex:2147483645, transform:'translate(-50%,-50%)', opacity:0 }} />
      <NavBar
        page={page}
        theme={theme}
        onToggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
        onNavigate={(p) => {
          if (p === 'home') handleBack()
          else if (p === 'restore') { setPage('restore'); window.scrollTo(0, 0) }
          else if (p === 'about') { setPage('about'); window.scrollTo(0, 0) }
        }}
      />
      {page === 'home' && <HomePage onSelectCiv={handleSelectCiv} onNavigate={(p) => { setPage(p); window.scrollTo(0, 0) }} />}
      {page === 'detail' && selectedCiv && <DetailPage civId={selectedCiv} onBack={handleBack} />}
      {page === 'restore' && <ArtifactRestorer />}
      {page === 'about' && <AboutPage />}
    </>
  )
}
