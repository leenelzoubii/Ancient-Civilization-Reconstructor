import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import civilizations from '../data/civilizations.json'
import { CIV_ILLUSTRATIONS, HERO_ILLUSTRATIONS, ARTIFACT_ILLUSTRATION } from './illustrations'
import ArtifactRestorer from './pages/ArtifactRestorer'
import AboutPage from './pages/AboutPage'
import VisualScene from './components/VisualScene'
import Flashcards from './components/Flashcards'
import WebGLViewer from './components/WebGLViewer'
import type { ViewerApi } from './components/WebGLViewer'
import { useInView } from './hooks/useInView'

/* =====================================================================
   Data
   ===================================================================== */

type Civ = (typeof civilizations.civilizations)[number]

const CIVS: Civ[] = civilizations.civilizations

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

/** Civilizations that ship a hand-written WebGL scene. */
const WEBGL_SCENES = new Set([
  'egypt',
  'rome',
  'maya',
  'taj-mahal',
  'petra',
  'khorfakkan',
  'al-jazirat-al-hamra',
  'dhayah-fort',
])

/** The five ancient-world sites shown in the main home grid. */
const ANCIENT_IDS = ['egypt', 'rome', 'maya', 'taj-mahal', 'petra']

const getCiv = (id: string) => CIVS.find((c) => c.id === id)

const accentOf = (id: string) => CIV_ACCENTS[id] ?? '#b8862b'

const taglineOf = (civ: Civ) => {
  const first = civ.overview.split(/(?<=\.)\s/)[0] ?? civ.overview
  return first.replace(/\.$/, '')
}

/* Information sections, in the supervisor's order plus our extras. */
const SECTIONS = [
  'overview',
  'history',
  'architecture',
  'dailylife',
  'culture',
  'achievements',
  'economy',
] as const
type Section = (typeof SECTIONS)[number]

const SECTION_TITLE: Record<Section, string> = {
  overview: 'Overview',
  history: 'History',
  architecture: 'Architecture',
  dailylife: 'Daily life',
  culture: 'Culture',
  achievements: 'Achievements',
  economy: 'Economy',
}

const sectionBody = (civ: Civ, section: Section): string => {
  switch (section) {
    case 'dailylife':
      return civ.dailyLife
    case 'overview':
      return civ.overview
    case 'history':
      return civ.history
    case 'architecture':
      return civ.architecture
    case 'culture':
      return civ.culture
    case 'achievements':
      return civ.achievements
    case 'economy':
      return civ.economy
  }
}

const factsOf = (civ: Civ) => [
  `Period: ${civ.era}`,
  `Region: ${civ.region}`,
  `Major cities: ${civ.capitals}`,
  `Language: ${civ.language}`,
]

/* =====================================================================
   Icons (same glyphs as the supervisor's app.js)
   ===================================================================== */

const ICONS = {
  arrowL: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
  arrowR: '<svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
  reset: '<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
  rotate: '<svg viewBox="0 0 24 24"><path d="M21 12a9 9 0 1 1-6.2-8.6"/><path d="M21 3v6h-6"/></svg>',
  full: '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>',
  camera: '<svg viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  upload: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>',
  vr: '<svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-4l-2-3h-2l-2 3H5a2 2 0 0 1-2-2z"/><circle cx="8" cy="12" r="1.6"/><circle cx="16" cy="12" r="1.6"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 3v4M17 5h4"/></svg>',
  cube: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.7z"/><path d="M3.3 7L12 12l8.7-5M12 22V12"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  bigArrow:
    '<svg viewBox="0 0 48 48"><path d="M8 24h30M28 14l10 10-10 10"/></svg>',
} as const

/** Injects a trusted SVG string without adding a layout box. */
function Svg({ html, className }: { html: string; className?: string }) {
  return (
    <span
      className={className}
      style={{ display: 'contents' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function Ico({ name }: { name: keyof typeof ICONS }) {
  return <Svg html={ICONS[name]} />
}

/* =====================================================================
   Session helpers (mirrors the supervisor's `store`)
   ===================================================================== */

type Session = { visited: string[]; lastCiv?: string }

function readSession(): Session {
  try {
    const raw = localStorage.getItem('acr.session')
    if (!raw) return { visited: [] }
    const parsed = JSON.parse(raw) as Session
    return { visited: Array.isArray(parsed.visited) ? parsed.visited : [], lastCiv: parsed.lastCiv }
  } catch {
    return { visited: [] }
  }
}

function markVisited(id: string) {
  try {
    const session = readSession()
    if (!session.visited.includes(id)) session.visited.push(id)
    session.lastCiv = id
    localStorage.setItem('acr.session', JSON.stringify(session))
  } catch {
    /* storage disabled — not important */
  }
}

/* =====================================================================
   Theme: light is the supervisor's palette, dark keeps the same warm
   brown / cream / gold language with inverted surfaces.
   ===================================================================== */

type Theme = 'light' | 'dark'

function readTheme(): Theme {
  const current = document.documentElement.dataset.theme
  if (current === 'dark' || current === 'light') return current
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/* =====================================================================
   Hash router
   ===================================================================== */

function useHashRoute() {
  const [path, setPath] = useState(() => (window.location.hash || '#/').slice(1))

  useEffect(() => {
    const onChange = () => {
      setPath((window.location.hash || '#/').slice(1))
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return path
}

const go = (href: string) => {
  if (window.location.hash === href) window.scrollTo(0, 0)
  else window.location.hash = href
}

/* =====================================================================
   Shared chrome
   ===================================================================== */

function SiteHeader({
  active,
  theme,
  onToggleTheme,
}: {
  active: 'home' | 'civilizations' | 'reconstruct' | 'about'
  theme: Theme
  onToggleTheme: () => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const results = query.trim()
    ? CIVS.filter((civ) => {
        const haystack = `${civ.name} ${civ.era} ${civ.region} ${civ.tags.join(' ')}`.toLowerCase()
        return haystack.includes(query.trim().toLowerCase())
      }).slice(0, 6)
    : []

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#/" className="brand" aria-label="Ancient Civilization Reconstructor — Home">
          <img className="brand-mark" src="/logo/logo-light.png" alt="ACR logo" width={120} height={40} />
          <span className="brand-text">
            Ancient Civilization
            <br />
            <strong>Reconstructor</strong>
          </span>
        </a>

        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={theme === 'dark'}
        >
          <Ico name={theme === 'dark' ? 'sun' : 'moon'} />
        </button>

        <button
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primary-nav"
          aria-label="Open menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id="primary-nav" className={`primary-nav${open ? ' open' : ''}`} aria-label="Main">
          <a href="#/" className={active === 'home' ? 'active' : ''} onClick={() => setOpen(false)}>
            Home
          </a>
          <a
            href="#/civilizations"
            className={active === 'civilizations' ? 'active' : ''}
            onClick={() => setOpen(false)}
          >
            Civilizations
          </a>
          <a
            href="#/reconstruct"
            className={active === 'reconstruct' ? 'active' : ''}
            onClick={() => setOpen(false)}
          >
            Reconstruct Artifact
          </a>
          <a href="#/about" className={active === 'about' ? 'active' : ''} onClick={() => setOpen(false)}>
            About
          </a>

          <div className="search" role="search">
            <label htmlFor="site-search" className="visually-hidden">
              Search civilizations
            </label>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="site-search"
              type="search"
              placeholder="Search…"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query.trim() ? (
              <div className="search-results" role="listbox">
                {results.length === 0 ? (
                  <div className="empty">No civilizations match “{query}”.</div>
                ) : (
                  results.map((civ) => (
                    <a key={civ.id} href={`#/civ/${civ.id}/info/overview`} onClick={() => { setQuery(''); setOpen(false) }}>
                      {civ.name}
                      <small>{civ.era}</small>
                    </a>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </nav>
      </div>
    </header>
  )
}

function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div>
          <img className="footer-mark" src="/logo/logo-light.png" alt="ACR logo" width={96} height={32} />
          <strong>Ancient Civilization Reconstructor</strong>
          <p>
            A Computing &amp; Artificial Intelligence capstone project — Applied Technology Schools,
            Baniyas Girls campus.
          </p>
        </div>
        <nav aria-label="Footer">
          <a href="#/civilizations">Civilizations</a>
          <a href="#/reconstruct">Reconstruct Artifact</a>
          <a href="#/about">About &amp; credits</a>
        </nav>
        <p className="footer-note">
          Reconstructions are educational estimates based on historical and archaeological references.
        </p>
        <p className="footer-credits">
          Built by Mahrah Alyammahi, Afraa Al Hamed, Hajar Alsaqqaf and Salama Alhadhrami ·
          supervised by Ms. Ashjan Saleh · 3D scenes, illustrations and the AI restorer were made for
          this project.
        </p>
      </div>
    </footer>
  )
}

function CivCard({
  civ,
  detailed = false,
  spotlight = false,
}: {
  civ: Civ
  detailed?: boolean
  spotlight?: boolean
}) {
  const visited = readSession().visited.includes(civ.id)
  const art = CIV_ILLUSTRATIONS[civ.id]
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 40 })

  return (
    <article
      className={`civ-card${spotlight ? ' civ-card-spotlight' : ''}`}
      style={{ '--accent': accentOf(civ.id) } as CSSProperties}
    >
      {visited ? <span className="badge">Visited</span> : null}
      {spotlight ? <span className="badge badge-rak">Ras Al Khaimah</span> : null}
      <div
        className="art"
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect()
          if (!rect.width || !rect.height) return
          const px = (e.clientX - rect.left) / rect.width
          const py = (e.clientY - rect.top) / rect.height
          setTilt({
            rx: (0.5 - py) * 10,
            ry: (px - 0.5) * 14,
            gx: Math.round(px * 100),
            gy: Math.round(py * 100),
          })
        }}
        onPointerLeave={() => setTilt({ rx: 0, ry: 0, gx: 50, gy: 40 })}
      >
        <div
          className="art-3d"
          style={
            {
              '--rx': `${tilt.rx}deg`,
              '--ry': `${tilt.ry}deg`,
              '--gx': `${tilt.gx}%`,
              '--gy': `${tilt.gy}%`,
            } as CSSProperties
          }
        >
          {art ? <Svg html={art(`${civ.id}${detailed ? 'd' : 'c'}`)} /> : null}
          <span className="art-glare" aria-hidden="true" />
        </div>
      </div>
      <div className="body">
        <span className="era">
          {civ.name} · {civ.era}
        </span>
        <h3>{civ.name}</h3>
        <p>{taglineOf(civ)}.</p>
        {detailed ? (
          <dl className="meta">
            <dt>Region</dt>
            <dd>{civ.region}</dd>
            <dt>Language</dt>
            <dd>{civ.language}</dd>
          </dl>
        ) : null}
        <div className="actions">
          <a className="btn btn-primary btn-sm" href={`#/civ/${civ.id}`}>
            <Ico name="cube" /> View in 3D
          </a>
          <a className="btn btn-outline btn-sm" href={`#/civ/${civ.id}/info/overview`}>
            Learn more
          </a>
        </div>
      </div>
    </article>
  )
}

function FeatureStrip() {
  return (
    <section className="feature-strip" aria-label="AI Artifact Reconstruction">
      <div className="container feature-strip-inner">
        <div className="feature-strip-art" aria-hidden="true">
          <Svg html={ARTIFACT_ILLUSTRATION()} />
        </div>
        <div className="feature-strip-copy">
          <span className="tag">NEW · AI FEATURE</span>
          <h2>AI Artifact Reconstruction</h2>
          <p>
            Upload a broken artifact, we predict its civilization and restore it — with a price
            estimate before anything is generated.
          </p>
        </div>
        <a className="btn btn-gold" href="#/reconstruct">
          <Ico name="sparkle" /> Reconstruct an artifact
        </a>
      </div>
    </section>
  )
}

function FeatureBanner() {
  return (
    <section className="feature-banner">
      <div>
        <Svg html={ARTIFACT_ILLUSTRATION()} />
      </div>
      <div>
        <span className="tag">NEW FEATURE</span>
        <h3>AI Artifact Reconstruction</h3>
        <p>
          Upload a photo of a broken artifact and the AI estimates how the complete piece may have
          looked — you get a price estimate before anything is generated.
        </p>
      </div>
      <div>
        <a className="btn btn-gold" href="#/reconstruct">
          <Ico name="sparkle" /> Try it now
        </a>
      </div>
    </section>
  )
}

/* =====================================================================
   1. Home
   ===================================================================== */

/** Scroll-reveal wrapper: content rises into place the first time it is seen. */
function Reveal({
  children,
  className = '',
  delay = 0,
  stagger = false,
}: {
  children: ReactNode
  className?: string
  delay?: number
  stagger?: boolean
}) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`reveal${stagger ? ' reveal-stagger' : ''}${inView ? ' in' : ''}${
        className ? ` ${className}` : ''
      }`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}

/** All eight worlds, in the order they appear on the civilizations page. */
const HOME_PREVIEW_IDS = [
  'egypt',
  'rome',
  'maya',
  'taj-mahal',
  'petra',
  'khorfakkan',
  'al-jazirat-al-hamra',
  'dhayah-fort',
]

function HomePage() {
  const session = readSession()
  const last = session.lastCiv ? getCiv(session.lastCiv) : undefined

  return (
    <div>
      <FeatureStrip />

      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow">Explore · Learn · Reconstruct</span>
            <h1>
              Step inside the worlds of <em>ancient civilizations</em>
            </h1>
            <p className="lead">
              Walk around digital reconstructions of Ancient Egypt, Rome, the Maya, the Taj Mahal
              and Petra, discover how people lived, and use AI to imagine how broken artifacts once
              looked — then explore the forts, pearl villages and desert heritage of the UAE.
            </p>
            <div className="hero-actions">
              <a className="btn btn-gold" href="#/civilizations">
                Explore now <Ico name="arrowR" />
              </a>
              <a className="btn btn-light" href="#/reconstruct">
                <Ico name="sparkle" /> Reconstruct an artifact
              </a>
            </div>
            <div className="hero-stats">
              <div>
                <strong>8</strong>
                <span>Civilizations</span>
              </div>
              <div>
                <strong>46</strong>
                <span>3D landmarks</span>
              </div>
              <div>
                <strong>4,800</strong>
                <span>Years of history</span>
              </div>
            </div>
            <button
              type="button"
              className="scroll-cue"
              onClick={() =>
                document.getElementById('home-what')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              <span aria-hidden="true" />
              Scroll to explore
            </button>
          </div>

          <div className="hero-collage" aria-hidden="true">
            <figure className="c1">
              <Svg html={HERO_ILLUSTRATIONS.egypt('h1')} />
              <figcaption>Giza, Egypt</figcaption>
            </figure>
            <figure className="c2">
              <Svg html={HERO_ILLUSTRATIONS.rome('h2')} />
              <figcaption>Rome, Italy</figcaption>
            </figure>
            <figure className="c3">
              <Svg html={HERO_ILLUSTRATIONS.uae('h3')} />
              <figcaption>Al Jahili Fort, UAE</figcaption>
            </figure>
            <figure className="c4">
              <Svg html={HERO_ILLUSTRATIONS.taj('h4')} />
              <figcaption>Taj Mahal, India</figcaption>
            </figure>
            <figure className="c5">
              <Svg html={HERO_ILLUSTRATIONS.petra('h5')} />
              <figcaption>Petra, Jordan</figcaption>
            </figure>
          </div>
        </div>
      </section>

      {last ? (
        <div className="container">
          <div className="resume">
            <span>
              Welcome back! Continue exploring <strong>{last.name}</strong>.
            </span>
            <a className="btn btn-gold btn-sm" href={`#/civ/${last.id}`}>
              Resume <Ico name="arrowR" />
            </a>
          </div>
        </div>
      ) : null}

      <section className="section home-intro" id="home-what">
        <div className="container home-split">
          <Reveal className="home-split-copy">
            <span className="eyebrow">What this is</span>
            <h2>A digital museum you can walk through — and repair</h2>
            <p className="lead">
              Ancient Civilization Reconstructor is a browser-based learning space built for our
              capstone project. It turns eight civilizations into explorable 3D scenes, readable
              guides and a hands-on AI repair studio.
            </p>
            <p>
              Nothing is downloaded and nothing is a video: every scene, illustration and reference
              image was made for this project, and the whole experience runs in a normal browser tab
              on a laptop, a tablet or a phone.
            </p>
            <ul className="home-points">
              <li>
                <strong>Walk the sites</strong>
                <span>Orbit, zoom and move between 46 numbered landmarks.</span>
              </li>
              <li>
                <strong>Read the story</strong>
                <span>Seven guide sections and a flashcard deck for every civilization.</span>
              </li>
              <li>
                <strong>Repair an artifact</strong>
                <span>Upload a cracked object and rebuild only the damage.</span>
              </li>
            </ul>
            <div className="hero-actions">
              <a className="btn btn-gold" href="#/civilizations">
                Browse civilizations <Ico name="arrowR" />
              </a>
              <a className="btn btn-outline" href="#/about">
                About the project
              </a>
            </div>
          </Reveal>

          <Reveal className="home-stack" delay={140}>
            <figure className="hs1">
              <Svg html={HERO_ILLUSTRATIONS.egypt('hs1')} />
              <figcaption>Giza, Egypt</figcaption>
            </figure>
            <figure className="hs2">
              <Svg html={HERO_ILLUSTRATIONS.rome('hs2')} />
              <figcaption>Rome, Italy</figcaption>
            </figure>
            <figure className="hs3">
              <Svg html={HERO_ILLUSTRATIONS.uae('hs3')} />
              <figcaption>Al Jahili Fort, UAE</figcaption>
            </figure>
            <span className="home-stack-badge">8 worlds · 46 landmarks</span>
          </Reveal>
        </div>
      </section>

      <section className="section home-band" id="home-do">
        <div className="container">
          <Reveal>
            <div className="section-title">
              <div>
                <span className="eyebrow">What you can do</span>
                <h2>Four ways to explore the past</h2>
                <p className="section-lead">
                  Start with a civilization, then move between the 3D scene, the written guide and the
                  artifact restorer.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal stagger className="steps-row">
            <div className="step-card">
              <h3>Choose a world</h3>
              <p>
                Start with Ancient Egypt, Rome, the Maya, the Taj Mahal, Petra or one of three Emirati
                heritage sites.
              </p>
            </div>
            <div className="step-card">
              <h3>Explore in 3D</h3>
              <p>
                Orbit a hand-built scene, fly to its numbered landmarks and switch to a walk-in VR
                view when you want to stand inside it.
              </p>
            </div>
            <div className="step-card">
              <h3>Learn the details</h3>
              <p>
                Seven illustrated sections cover history, architecture, daily life, culture, economy
                and achievements — with a flashcard quiz at the end.
              </p>
            </div>
            <div className="step-card">
              <h3>Reconstruct an artifact</h3>
              <p>
                Upload a photo of a broken object, mark the damage and repair it with AI — with the
                price shown before anything is generated.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" id="home-worlds">
        <div className="container">
          <Reveal>
            <div className="section-title">
              <div>
                <span className="eyebrow">The civilizations</span>
                <h2>Eight worlds, one scroll</h2>
                <p className="section-lead">
                  Five ancient civilizations and three Emirati heritage sites — from the pyramids of
                  Giza to a hilltop fort in Ras Al Khaimah.
                </p>
              </div>
              <a className="btn btn-outline btn-sm" href="#/civilizations">
                All eight worlds <Ico name="arrowR" />
              </a>
            </div>
          </Reveal>
          <Reveal stagger className="civ-preview-grid">
            {HOME_PREVIEW_IDS.map((id) => {
              const civ = getCiv(id)
              const art = CIV_ILLUSTRATIONS[id]
              if (!civ) return null
              return (
                <a
                  className="civ-preview"
                  key={id}
                  href={`#/civ/${id}`}
                  style={{ '--accent': accentOf(id) } as CSSProperties}
                >
                  <span className="civ-preview-art" aria-hidden="true">
                    {art ? <Svg html={art(`pv-${id}`)} /> : null}
                  </span>
                  <span className="civ-preview-body">
                    <span className="civ-preview-era">{civ.era}</span>
                    <strong>{civ.name}</strong>
                    <span className="civ-preview-tag">{taglineOf(civ)}.</span>
                    <span className="civ-preview-open">
                      Open in 3D <Ico name="arrowR" />
                    </span>
                  </span>
                </a>
              )
            })}
          </Reveal>
        </div>
      </section>

      <section className="section home-band home-ai" id="home-ai">
        <div className="container home-split home-split-reverse">
          <Reveal className="home-ai-art">
            <div className="ai-art-frame">
              <Svg html={ARTIFACT_ILLUSTRATION()} />
              <span className="ai-chip ai-chip-1">Cracks only</span>
              <span className="ai-chip ai-chip-2">Price first</span>
              <span className="ai-chip ai-chip-3">Manual + automatic</span>
            </div>
          </Reveal>
          <Reveal className="home-split-copy" delay={120}>
            <span className="eyebrow">The AI restorer</span>
            <h2>Repair the cracks — keep the artifact</h2>
            <p className="lead">
              The restorer is built to repair damage, not to invent a new object. You choose what
              gets rebuilt, and every other pixel of your photo stays exactly as it is.
            </p>
            <ol className="ai-steps">
              <li>
                <strong>Upload a photo</strong>
                <span>
                  A phone photo is enough. The image is resized in your browser before anything is
                  sent.
                </span>
              </li>
              <li>
                <strong>Mark the damage</strong>
                <span>
                  Paint the cracks yourself, or let the local detector find thin cracks and small
                  chips and show them in red.
                </span>
              </li>
              <li>
                <strong>Confirm the price</strong>
                <span>
                  You see the estimated cost and the exact repair area before a single pixel is
                  generated.
                </span>
              </li>
            </ol>
            <div className="hero-actions">
              <a className="btn btn-gold" href="#/reconstruct">
                <Ico name="sparkle" /> Reconstruct an artifact
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" id="home-why">
        <div className="container">
          <Reveal>
            <div className="section-title">
              <div>
                <span className="eyebrow">Why it works</span>
                <h2>History you can walk through</h2>
                <p className="section-lead">
                  Every part of the site is built to make an ancient place feel understandable — not
                  just readable.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal stagger className="feature-grid">
            <article className="feature-card">
              <span className="feature-ico" aria-hidden="true">3D</span>
              <h3>Numbered landmarks</h3>
              <p>
                Each reconstruction has five or six numbered points. Click a number to fly to that
                spot and read what makes it important.
              </p>
            </article>
            <article className="feature-card">
              <span className="feature-ico" aria-hidden="true">VR</span>
              <h3>VR &amp; walk-in view</h3>
              <p>
                Stand at eye level beside a pyramid or inside a fort — with a headset, a phone
                viewer, or no headset at all.
              </p>
            </article>
            <article className="feature-card">
              <span className="feature-ico" aria-hidden="true">AI</span>
              <h3>Spend-safe AI restorer</h3>
              <p>
                Paint the damage or let the AI detect it. You always see the price and confirm before
                anything is generated.
              </p>
            </article>
            <article className="feature-card">
              <span className="feature-ico" aria-hidden="true">✦</span>
              <h3>Learn and test yourself</h3>
              <p>
                Seven information sections and a flashcard deck for every civilization, from daily
                life to economy and achievements.
              </p>
            </article>
          </Reveal>

          <Reveal stagger className="stat-band">
            <div>
              <strong>8</strong>
              <span>Civilizations</span>
            </div>
            <div>
              <strong>46</strong>
              <span>Numbered landmarks</span>
            </div>
            <div>
              <strong>3</strong>
              <span>UAE heritage sites</span>
            </div>
            <div>
              <strong>4,800</strong>
              <span>Years of history</span>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-panel">
            <div>
              <span className="eyebrow">Start exploring</span>
              <h2>Pick a civilization and step inside</h2>
              <p>
                No downloads and no plugins: every scene runs in your browser, and every landmark is
                one click away.
              </p>
            </div>
            <div className="cta-actions">
              <a className="btn btn-gold" href="#/civilizations">
                Browse all civilizations <Ico name="arrowR" />
              </a>
              <a className="btn btn-outline" href="#/reconstruct">
                <Ico name="sparkle" /> Restore an artifact
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

/* =====================================================================
   2. Civilization selection
   ===================================================================== */

function CivilizationsPage() {
  return (
    <div>
      <div className="container">
        <div className="page-head">
          <span className="eyebrow">Civilizations</span>
          <h1>Select a Civilization</h1>
          <p className="lead">
            Each civilization includes an interactive 3D reconstruction and a guide to its history,
            architecture, daily life and achievements.
          </p>
        </div>
        <div className="section-title" style={{ marginTop: 8 }}>
          <div>
            <span className="eyebrow">Ancient world</span>
            <h2>Five ancient sites</h2>
          </div>
        </div>
        <div className="civ-grid">
          {CIVS.filter((civ) => ANCIENT_IDS.includes(civ.id)).map((civ) => (
            <CivCard key={civ.id} civ={civ} detailed />
          ))}
        </div>
      </div>

      {/* Our own UAE heritage: the desert panorama, camels and the three Emirati sites. */}
      <VisualScene onSelectCiv={(id) => go(`#/civ/${id}`)} />

      <div className="container">
        <FeatureBanner />
        <div style={{ height: 56 }} />
      </div>
    </div>
  )
}

/* =====================================================================
   3. VR chooser
   ===================================================================== */

function VrChooser({
  civName,
  poiCount,
  viewer,
  scene,
  accent,
  onClose,
}: {
  civName: string
  poiCount: number
  viewer: any
  scene: any
  accent: string
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [xr, setXr] = useState(false)

  useEffect(() => {
    dialogRef.current?.showModal()
    const VRMode = (window as any).VRMode
    VRMode?.xrSupported?.()
      .then((supported: boolean) => setXr(Boolean(supported)))
      .catch(() => setXr(false))
  }, [])

  const start = async (mode: 'xr' | 'stereo' | 'mono') => {
    const VRMode = (window as any).VRMode
    dialogRef.current?.close()
    if (!VRMode || !viewer || !scene) return
    try {
      if (mode === 'stereo') await VRMode.requestMotionPermission?.()
      viewer.orbit.autoRotate = false
      await VRMode.start(viewer, scene, { mode, accent, onStop: () => {}, onExit: () => {} })
    } catch {
      /* the headset or the browser refused the session */
    }
    onClose()
  }

  return (
    <dialog ref={dialogRef} className="vr-dialog" onClose={onClose}>
      <form method="dialog">
        <div className="vr-dialog-head">
          <h2>Step inside {civName}</h2>
          <button className="vr-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <p className="muted">
          You will stand at eye level at real-world scale and travel between the {poiCount}{' '}
          landmarks.
        </p>
        <div className="vr-options">
          <button type="button" className="vr-opt" disabled={!xr} onClick={() => start('xr')}>
            <span className="vr-ico">
              <Ico name="vr" />
            </span>
            <span>
              <strong>VR headset</strong>
              <small>
                {xr
                  ? 'Meta Quest, Pico and other WebXR headsets. Trigger = next landmark, thumbsticks = walk and turn.'
                  : "No VR headset detected. Open this website in your headset's browser to use this option."}
              </small>
            </span>
          </button>
          <button type="button" className="vr-opt" onClick={() => start('stereo')}>
            <span className="vr-ico">
              <Ico name="camera" />
            </span>
            <span>
              <strong>Phone VR viewer</strong>
              <small>
                Split screen for Google Cardboard-style viewers. Turn your head to look around; tap
                to move to the next landmark.
              </small>
            </span>
          </button>
          <button type="button" className="vr-opt" onClick={() => start('mono')}>
            <span className="vr-ico">
              <Ico name="cube" />
            </span>
            <span>
              <strong>Walk-in view (no headset)</strong>
              <small>
                Full-screen first-person view. Drag to look around, W A S D to walk, ← → to change
                landmark.
              </small>
            </span>
          </button>
        </div>
      </form>
    </dialog>
  )
}

/* =====================================================================
   4. 3D reconstruction view
   ===================================================================== */

function CivPage({ civ }: { civ: Civ }) {
  const viewerHost = useRef<HTMLDivElement>(null)
  const markerLayer = useRef<HTMLDivElement>(null)
  const [api, setApi] = useState<ViewerApi | null>(null)
  const [poi, setPoi] = useState(-1)
  const [spin, setSpin] = useState(false)
  const [vrOpen, setVrOpen] = useState(false)
  const goPoi = useRef<(i: number) => void>(() => {})

  const hasScene = WEBGL_SCENES.has(civ.id)
  const scene = api?.scene
  const pois: any[] = scene?.pois ?? []

  useEffect(() => {
    markVisited(civ.id)
    setApi(null)
    setPoi(-1)
    setSpin(false)
  }, [civ.id])

  useEffect(() => {
    if (!api || !markerLayer.current) return
    const { viewer, scene: sceneDef } = api
    const layer = markerLayer.current
    layer.innerHTML = ''

    const select = (index: number) => {
      const next = (index + sceneDef.pois.length) % sceneDef.pois.length
      viewer.orbit.flyTo(sceneDef.pois[next].view)
      setPoi(next)
      Array.from(layer.querySelectorAll('.marker')).forEach((el, i) =>
        el.classList.toggle('active', i === next),
      )
    }
    goPoi.current = select

    sceneDef.pois.forEach((point: any, i: number) => {
      const button = document.createElement('button')
      button.className = 'marker'
      button.innerHTML = `${i + 1}<span class="label">${point.name}</span>`
      button.setAttribute('aria-label', `Landmark ${i + 1}: ${point.name}`)
      button.addEventListener('click', () => select(i))
      layer.appendChild(button)
      viewer.addMarker(button, point.pos)
    })

    return () => {
      layer.innerHTML = ''
    }
  }, [api])

  const poiName = poi >= 0 ? `${poi + 1}. ${pois[poi]?.name ?? ''}` : 'Explore the reconstruction'
  const poiText =
    poi >= 0
      ? (pois[poi]?.text ?? '')
      : `Use the arrows or the numbered markers to visit ${pois.length} key landmarks of ${civ.name}. Drag the scene to look around.`

  const resetView = () => {
    if (!api) return
    api.viewer.orbit.flyTo(api.scene.camera)
    setPoi(-1)
    Array.from(markerLayer.current?.querySelectorAll('.marker') ?? []).forEach((el) =>
      el.classList.remove('active'),
    )
  }

  const toggleSpin = () => {
    if (!api) return
    const next = !api.viewer.orbit.autoRotate
    api.viewer.orbit.autoRotate = next
    setSpin(next)
  }

  const screenshot = () => {
    if (!api) return
    const link = document.createElement('a')
    link.href = api.viewer.snapshot()
    link.download = `${civ.id}-reconstruction.png`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const fullscreen = () => {
    const el = document.querySelector('.viewer-wrap')
    if (document.fullscreenElement) document.exitFullscreen()
    else if (el instanceof HTMLElement) el.requestFullscreen?.().catch(() => {})
  }

  return (
    <div className="container" style={{ '--accent': accentOf(civ.id) } as CSSProperties}>
      <div className="page-head" style={{ paddingBottom: 20 }}>
        <a className="back" href="#/civilizations">
          ← Back to civilizations
        </a>
        <span className="eyebrow">{civ.era}</span>
        <h1 style={{ margin: 0 }}>{civ.name}</h1>
      </div>

      <div className="view-layout">
        <div>
          <div className="viewer-wrap">
            <div className="viewer" id="viewer" ref={viewerHost} style={{ background: scene?.sky ?? '#e4c48a' }}>
              {hasScene ? (
                <div className="viewer-hint">
                  {typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
                    ? 'Drag to rotate · Pinch to zoom'
                    : 'Drag to rotate · Scroll to zoom · Shift + drag to pan'}
                </div>
              ) : null}

              <div className="marker-layer" ref={markerLayer} />

              {hasScene ? (
                <>
                  <WebGLViewer sceneId={civ.id} hostRef={viewerHost} onReady={setApi} />
                  <div className="viewer-ui">
                    <button
                      className="icon-btn"
                      title="VR / walk-in view"
                      aria-label="Enter VR or walk-in view"
                      onClick={() => setVrOpen(true)}
                    >
                      <Ico name="vr" />
                    </button>
                    <button
                      className="icon-btn"
                      title="Zoom in"
                      aria-label="Zoom in"
                      onClick={() => api?.viewer.orbit.zoom(0.8)}
                    >
                      <Ico name="plus" />
                    </button>
                    <button
                      className="icon-btn"
                      title="Zoom out"
                      aria-label="Zoom out"
                      onClick={() => api?.viewer.orbit.zoom(1.25)}
                    >
                      <Ico name="minus" />
                    </button>
                    <button className="icon-btn" title="Reset view" aria-label="Reset view" onClick={resetView}>
                      <Ico name="reset" />
                    </button>
                    <button
                      className="icon-btn"
                      title="Auto-rotate"
                      aria-label="Auto-rotate"
                      aria-pressed={spin}
                      onClick={toggleSpin}
                    >
                      <Ico name="rotate" />
                    </button>
                    <button
                      className="icon-btn"
                      title="Save screenshot"
                      aria-label="Save screenshot"
                      onClick={screenshot}
                    >
                      <Ico name="camera" />
                    </button>
                    <button
                      className="icon-btn"
                      title="Full screen"
                      aria-label="Full screen"
                      onClick={fullscreen}
                    >
                      <Ico name="full" />
                    </button>
                  </div>
                </>
              ) : (
                <iframe
                  src={`https://sketchfab.com/models/${civ.sketchfabScene}/embed?autostart=1`}
                  title={`${civ.name} — 3D model`}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                  allow="autoplay; fullscreen; vr; xr-spatial-tracking"
                  allowFullScreen
                />
              )}

              {hasScene ? <div className="viewer-title">{scene?.title ?? civ.name}</div> : null}
            </div>

            {hasScene ? (
              <div className="poi-bar">
                <button
                  className="nav-arrow"
                  aria-label="Previous landmark"
                  onClick={() => goPoi.current(poi - 1)}
                >
                  <Ico name="arrowL" />
                </button>
                <div className="poi-text" aria-live="polite">
                  <h3>{poiName}</h3>
                  <p>{poiText}</p>
                  <div className="poi-dots">
                    {pois.map((point: any, i: number) => (
                      <button
                        key={point.name}
                        className={i === poi ? 'active' : ''}
                        aria-label={`Landmark ${i + 1}: ${point.name}`}
                        aria-current={i === poi ? 'true' : undefined}
                        onClick={() => goPoi.current(i)}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  className="nav-arrow"
                  aria-label="Next landmark"
                  onClick={() => goPoi.current(poi + 1)}
                >
                  <Ico name="arrowR" />
                </button>
              </div>
            ) : (
              <div className="poi-bar">
                <div className="poi-text">
                  <h3>Explore the reconstruction</h3>
                  <p>
                    Drag the model to look around and use the Sketchfab toolbar to zoom, inspect and
                    enter full screen.
                  </p>
                </div>
              </div>
            )}
          </div>

          {hasScene ? (
            <div className="vr-cta">
              <div>
                <strong>Step inside in VR</strong>
                <span>
                  Stand at eye level beside each landmark — with a VR headset, a phone VR viewer, or
                  no headset at all.
                </span>
              </div>
              <button className="btn btn-gold" onClick={() => setVrOpen(true)}>
                <Ico name="vr" /> Enter VR
              </button>
            </div>
          ) : null}
        </div>

        <aside className="side-panel">
          <h3>Information</h3>
          <ul>
            {SECTIONS.map((section) => (
              <li key={section}>
                <a href={`#/civ/${civ.id}/info/${section}`}>{SECTION_TITLE[section]}</a>
              </li>
            ))}
            <li>
              <a href={`#/civ/${civ.id}/info/flashcards`}>Flashcards</a>
            </li>
          </ul>
          <dl>
            <div>
              <dt>Period</dt>
              <dd>{civ.era}</dd>
            </div>
            <div>
              <dt>Region</dt>
              <dd>{civ.region}</dd>
            </div>
            <div>
              <dt>Major cities</dt>
              <dd>{civ.capitals}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{civ.language}</dd>
            </div>
          </dl>
          <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
            {CIVS.filter((other) => other.id !== civ.id).map((other) => (
              <a key={other.id} className="btn btn-outline btn-sm" href={`#/civ/${other.id}`}>
                {other.name}
              </a>
            ))}
          </div>
        </aside>
      </div>

      {vrOpen && api ? (
        <VrChooser
          civName={civ.name}
          poiCount={pois.length}
          viewer={api.viewer}
          scene={api.scene}
          accent={accentOf(civ.id)}
          onClose={() => setVrOpen(false)}
        />
      ) : null}
    </div>
  )
}

/* =====================================================================
   5. Information page
   ===================================================================== */

/** Tall 400x260 artwork where we have it (the three supervisor civs). */
const FIGURE_ART: Record<string, (id?: string) => string> = { ...HERO_ILLUSTRATIONS }

/** Splits long single-paragraph data into readable paragraphs. */
function paragraphsOf(text: string): string[] {
  const blocks = text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)

  return blocks.flatMap((block) => {
    if (block.startsWith('## ') || block.length <= 250) return [block]
    const sentences = block.match(/[^.!?]+[.!?]+["')\]]*\s*/g) ?? [block]
    const out: string[] = []
    let current = ''
    for (const sentence of sentences) {
      if (current && current.length + sentence.length > 250) {
        out.push(current.trim())
        current = ''
      }
      current += sentence
    }
    if (current.trim()) out.push(current.trim())
    return out
  })
}

function RichText({ text, list = false }: { text: string; list?: boolean }) {
  if (list) {
    const items = text
      .split(/(?<=\.)\s+(?=[A-Z])/)
      .map((item) => item.trim())
      .filter(Boolean)
    return (
      <ul className="ach">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    )
  }

  const blocks = paragraphsOf(text)

  return (
    <>
      {blocks.map((block, i) =>
        block.startsWith('## ') ? <h3 key={i}>{block.slice(3)}</h3> : <p key={i}>{block}</p>,
      )}
    </>
  )
}

function InfoPage({ civ, section }: { civ: Civ; section: string }) {
  const valid: string[] = [...SECTIONS, 'flashcards']
  const active = valid.includes(section) ? section : 'overview'
  const art = (FIGURE_ART[civ.id] ?? CIV_ILLUSTRATIONS[civ.id]) as
    | ((id?: string) => string)
    | undefined

  useEffect(() => {
    markVisited(civ.id)
  }, [civ.id])

  const index = SECTIONS.indexOf(active as Section)
  const prev = index > 0 ? SECTIONS[index - 1] : null
  const next = index >= 0 && index < SECTIONS.length - 1 ? SECTIONS[index + 1] : null

  const title =
    active === 'flashcards' ? 'Flashcards' : SECTION_TITLE[active as Section]

  return (
    <div className="container" style={{ '--accent': accentOf(civ.id) } as CSSProperties}>
      <div className="page-head" style={{ paddingBottom: 24 }}>
        <a className="back" href={`#/civ/${civ.id}`}>
          ← Back to 3D reconstruction
        </a>
        <span className="eyebrow">
          {civ.name} · {civ.era}
        </span>
        <h1 style={{ margin: 0 }}>{title}</h1>
      </div>

      <div className="info-layout">
        <nav className="info-nav" aria-label={`${civ.name} sections`}>
          <div className="civ-name">{civ.name}</div>
          {SECTIONS.map((key) => (
            <a
              key={key}
              href={`#/civ/${civ.id}/info/${key}`}
              className={key === active ? 'active' : ''}
              aria-current={key === active ? 'page' : undefined}
            >
              {SECTION_TITLE[key]}
            </a>
          ))}
          <a
            href={`#/civ/${civ.id}/info/flashcards`}
            className={active === 'flashcards' ? 'active' : ''}
            aria-current={active === 'flashcards' ? 'page' : undefined}
          >
            Flashcards
          </a>
          <div className="other">
            {CIVS.filter((other) => other.id !== civ.id).map((other) => (
              <a key={other.id} href={`#/civ/${other.id}/info/${active === 'flashcards' ? 'overview' : active}`}>
                {other.name} →
              </a>
            ))}
          </div>
        </nav>

        <div className="info-main">
          <article>
            {art && active !== 'flashcards' ? (
              <figure className="figure">
                <Svg html={art('inf')} />
                <figcaption>Illustration: {civ.name}</figcaption>
              </figure>
            ) : null}

            {active === 'flashcards' ? (
              <Flashcards civId={civ.id} />
            ) : (
              <>
                {active === 'achievements' ? (
                  <p>{civ.name} left a lasting legacy. Here are some of its most important achievements:</p>
                ) : null}
                <RichText
                  text={sectionBody(civ, active as Section)}
                  list={active === 'achievements'}
                />
              </>
            )}

            <div className="key-facts">
              <h3>Key facts</h3>
              <ul>
                {factsOf(civ).map((fact) => (
                  <li key={fact}>{fact}</li>
                ))}
              </ul>
            </div>
          </article>

          <div className="pager">
            {prev ? (
              <a className="btn btn-outline" href={`#/civ/${civ.id}/info/${prev}`}>
                ← {SECTION_TITLE[prev]}
              </a>
            ) : (
              <a className="btn btn-outline" href={`#/civ/${civ.id}`}>
                <Ico name="cube" /> 3D reconstruction
              </a>
            )}
            {next ? (
              <a className="btn btn-primary" href={`#/civ/${civ.id}/info/${next}`}>
                {SECTION_TITLE[next]} →
              </a>
            ) : (
              <a className="btn btn-primary" href={`#/civ/${civ.id}`}>
                <Ico name="cube" /> Back to 3D view
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/* =====================================================================
   App shell
   ===================================================================== */

export default function App() {
  const path = useHashRoute()
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('acr.theme', theme)
    } catch {
      /* storage disabled — the theme still applies for this visit */
    }
  }, [theme])

  const toggleTheme = useCallback(
    () => setTheme((current) => (current === 'dark' ? 'light' : 'dark')),
    []
  )

  const route = (() => {
    if (/^\/?$/.test(path)) return { name: 'home' as const }
    if (path === '/civilizations') return { name: 'civilizations' as const }
    if (path === '/reconstruct') return { name: 'reconstruct' as const }
    if (path === '/about') return { name: 'about' as const }

    const info = path.match(/^\/civ\/([\w-]+)\/info(?:\/([\w-]+))?\/?$/)
    if (info) {
      const civ = getCiv(info[1])
      if (civ) return { name: 'info' as const, civ, section: info[2] ?? 'overview' }
    }

    const civMatch = path.match(/^\/civ\/([\w-]+)\/?$/)
    if (civMatch) {
      const civ = getCiv(civMatch[1])
      if (civ) return { name: 'civ' as const, civ }
    }

    return { name: 'missing' as const }
  })()

  useEffect(() => {
    const titles: Record<string, string> = {
      home: '',
      civilizations: 'Select a Civilization',
      reconstruct: 'AI Artifact Reconstruction',
      about: 'About the Project',
    }
    let title = route.name in titles ? titles[route.name] : ''
    if (route.name === 'civ') title = `${route.civ.name} — 3D Reconstruction`
    if (route.name === 'info') title = `${route.civ.name} — ${route.section}`
    document.title = title ? `${title} — Ancient Civilization Reconstructor` : 'Ancient Civilization Reconstructor'
  }, [route])

  const activeNav =
    route.name === 'home'
      ? 'home'
      : route.name === 'civilizations' || route.name === 'civ' || route.name === 'info'
        ? 'civilizations'
        : route.name === 'reconstruct'
          ? 'reconstruct'
          : 'about'

  /* Custom cursor (visual only — behaviour unchanged). */
  const cursorDot = useRef<HTMLDivElement>(null)
  const cursorRing = useRef<HTMLDivElement>(null)
  const cursorGlow = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dot = cursorDot.current
    const ring = cursorRing.current
    const glow = cursorGlow.current
    if (!dot || !ring || !glow) return

    let mx = -200
    let my = -200
    let rx = -200
    let ry = -200
    let gx = -200
    let gy = -200
    let raf = 0

    const move = (e: MouseEvent) => {
      mx = e.clientX
      my = e.clientY
      dot.style.left = `${mx}px`
      dot.style.top = `${my}px`
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      glow.style.opacity = '1'
    }
    const leave = () => {
      dot.style.opacity = '0'
      ring.style.opacity = '0'
      glow.style.opacity = '0'
    }
    const enter = () => {
      dot.style.opacity = '1'
      ring.style.opacity = '1'
      glow.style.opacity = '1'
    }

    const tick = () => {
      rx += (mx - rx) * 0.12
      ry += (my - ry) * 0.12
      gx += (mx - gx) * 0.06
      gy += (my - gy) * 0.06
      ring.style.left = `${rx}px`
      ring.style.top = `${ry}px`
      glow.style.left = `${gx}px`
      glow.style.top = `${gy}px`
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

  let view: ReactNode
  switch (route.name) {
    case 'home':
      view = <HomePage />
      break
    case 'civilizations':
      view = <CivilizationsPage />
      break
    case 'civ':
      view = <CivPage civ={route.civ} />
      break
    case 'info':
      view = <InfoPage civ={route.civ} section={route.section} />
      break
    case 'reconstruct':
      view = <ArtifactRestorer />
      break
    case 'about':
      view = <AboutPage />
      break
    default:
      view = (
        <div className="container">
          <div className="page-head">
            <span className="eyebrow">404</span>
            <h1>This page doesn&apos;t exist</h1>
            <p className="lead">The link may be old, or the civilization was renamed.</p>
            <a className="btn btn-gold" href="#/">
              Back to home
            </a>
          </div>
        </div>
      )
  }

  return (
    <>
      <div
        ref={cursorDot}
        style={{
          position: 'fixed',
          top: -100,
          left: -100,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#d4af37,#e56b4f)',
          boxShadow: '0 0 12px rgba(212,175,55,0.8), 0 0 24px rgba(212,175,55,0.4)',
          pointerEvents: 'none',
          zIndex: 2147483647,
          transform: 'translate(-50%,-50%)',
          opacity: 0,
        }}
      />
      <div
        ref={cursorRing}
        style={{
          position: 'fixed',
          top: -100,
          left: -100,
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1.5px solid rgba(212,175,55,0.5)',
          boxShadow: '0 0 15px rgba(212,175,55,0.15)',
          pointerEvents: 'none',
          zIndex: 2147483646,
          transform: 'translate(-50%,-50%)',
          opacity: 0,
        }}
      />
      <div
        ref={cursorGlow}
        style={{
          position: 'fixed',
          top: -100,
          left: -100,
          width: 100,
          height: 100,
          borderRadius: '50%',
          background:
            'radial-gradient(circle,rgba(212,175,55,0.12) 0%,rgba(229,107,79,0.06) 40%,transparent 70%)',
          pointerEvents: 'none',
          zIndex: 2147483645,
          transform: 'translate(-50%,-50%)',
          opacity: 0,
        }}
      />

      <a className="skip-link" href="#app">
        Skip to content
      </a>

      <SiteHeader
        active={activeNav as 'home' | 'civilizations' | 'reconstruct' | 'about'}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main id="app" tabIndex={-1} aria-live="polite">
        <div key={path} className="fade-in">
          {view}
        </div>
      </main>

      <SiteFooter />
    </>
  )
}
