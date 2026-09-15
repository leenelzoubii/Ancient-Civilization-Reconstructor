import { useState } from 'react'
import civilizations from '../data/civilizations.json'
import ArtifactRestorer from './pages/ArtifactRestorer'
import AboutPage from './pages/AboutPage'

const TAG_COLORS: Record<string, string> = {
  primary: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  secondary: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  accent: 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
  info: 'bg-sky-500/20 text-sky-400 border border-sky-500/30',
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

const TABS = ['overview', 'history', 'architecture', 'daily-life', 'achievements'] as const
type Tab = typeof TABS[number]

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  history: 'History',
  architecture: 'Architecture',
  'daily-life': 'Daily Life',
  achievements: 'Achievements',
}

type Page = 'home' | 'detail' | 'restore' | 'about'

function NavBar({ page, onNavigate }: { page: Page; onNavigate: (p: Page) => void }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <button onClick={() => onNavigate('home')} className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="text-lg font-bold text-amber-400 hidden sm:block" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ancient Civ Reconstructor
          </span>
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className={`text-sm font-medium transition-colors cursor-pointer ${page === 'home' ? 'text-amber-400' : 'text-gray-400 hover:text-white'}`}
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('home')
              setTimeout(() => {
                document.getElementById('civilizations')?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }}
            className={`text-sm font-medium transition-colors cursor-pointer ${page === 'home' ? 'text-gray-400 hover:text-white' : 'text-amber-400'}`}
          >
            Civilizations
          </button>
          <button
            onClick={() => onNavigate('restore')}
            className={`text-sm font-medium transition-colors cursor-pointer ${page === 'restore' ? 'text-amber-400' : 'text-gray-400 hover:text-white'}`}
          >
            AI Restorer
          </button>
          <button
            onClick={() => onNavigate('about')}
            className={`text-sm font-medium transition-colors cursor-pointer ${page === 'about' ? 'text-amber-400' : 'text-gray-400 hover:text-white'}`}
          >
            About
          </button>
        </div>
      </div>
    </nav>
  )
}

function HeroSection({ onExplore }: { onExplore: () => void }) {
  return (
    <header className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0f0f0f] z-10" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-3xl" />
      </div>
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
        <div className="animate-fade-in-up">
          <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-4">Explore the Past</p>
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black mb-4 leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
            <span className="text-white">Ancient</span>
            <br />
            <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent">Civilizations</span>
          </h1>
          <p className="text-xl sm:text-2xl text-gray-300 font-light mt-2 mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Reconstructor
          </p>
        </div>
        <div className="animate-fade-in-up mt-6" style={{ animationDelay: '0.2s' }}>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Reconstruct historical environments and discover the wonders of the past through 3D models, videos, and immersive content.
          </p>
          <button
            onClick={onExplore}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold rounded-xl text-lg hover:from-amber-400 hover:to-orange-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25 cursor-pointer"
          >
            Start Exploring
          </button>
        </div>
        <div className="animate-fade-in-up mt-12 flex justify-center gap-8 text-sm text-gray-500" style={{ animationDelay: '0.4s' }}>
          <span>8 Civilizations</span>
          <span>3D Models</span>
          <span>Historical Videos</span>
          <span>Interactive Content</span>
        </div>
      </div>
    </header>
  )
}

function CivilizationCard({ civ, index, onClick }: { civ: typeof civilizations.civilizations[0]; index: number; onClick: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const tags = TAG_MAPS[civ.id] || []

  return (
    <div
      className="animate-fade-in-up rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] hover:border-amber-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5 overflow-hidden"
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-5 cursor-pointer flex items-start gap-4 group"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all">
          <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors truncate">{civ.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5 uppercase tracking-wider">{civ.id.replace(/-/g, ' ')}</p>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-300 flex-shrink-0 mt-1 ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div className={`transition-all duration-500 ease-in-out ${expanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${TAG_COLORS[tag.color]}`}>
                {tag.label}
              </span>
            ))}
          </div>
          <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{civ.overview}</p>
          <button
            onClick={(e) => { e.stopPropagation(); onClick() }}
            className="w-full py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-amber-500/20 hover:border-amber-500/40 cursor-pointer"
          >
            View Full Details
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function HomePage({ onSelectCiv }: { onSelectCiv: (id: string) => void }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <HeroSection onExplore={() => document.getElementById('civilizations')?.scrollIntoView({ behavior: 'smooth' })} />

      <section id="civilizations" className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">
        <div className="text-center mb-12">
          <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">Choose Your Journey</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Select a Civilization
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">Click any civilization to expand details, or click "View Full Details" to explore the full reconstruction page.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {civilizations.civilizations.map((civ, index) => (
            <CivilizationCard
              key={civ.id}
              civ={civ}
              index={index}
              onClick={() => onSelectCiv(civ.id)}
            />
          ))}
        </div>
      </section>

      <footer className="border-t border-white/5 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>Ancient Civilization Reconstructor &copy; 2026. Educational & Research Project.</p>
        </div>
      </footer>
    </div>
  )
}

function DetailPage({ civId, onBack }: { civId: string; onBack: () => void }) {
  const civ = civilizations.civilizations.find(c => c.id === civId)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const tags = TAG_MAPS[civId] || []

  if (!civ) return <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center text-white">Civilization not found</div>

  const tabContent: Record<Tab, string> = {
    overview: civ.overview,
    history: civ.history,
    architecture: civ.architecture,
    'daily-life': civ.dailyLife,
    achievements: civ.achievements,
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-400 hover:text-amber-400 transition-colors mb-8 cursor-pointer group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Civilizations
        </button>

        <div className="animate-fade-in-up">
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, i) => (
              <span key={i} className={`px-3 py-1 rounded-full text-xs font-medium ${TAG_COLORS[tag.color]}`}>
                {tag.label}
              </span>
            ))}
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            {civ.name}
          </h1>
          <p className="text-gray-500 text-lg capitalize">{civ.id.replace(/-/g, ' ')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="animate-scale-in rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-gray-500 ml-2">3D Model - Sketchfab</span>
              </div>
              <a
                href={`https://sketchfab.com/models/${civ.sketchfabScene}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-amber-400 hover:text-amber-300 underline"
              >
                Open on Sketchfab ↗
              </a>
            </div>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '75%' }}>
              <iframe
                src={`https://sketchfab.com/models/${civ.sketchfabScene}/embed?autostart=0`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; fullscreen; xr-spatial-tracking"
                title={`${civ.name} 3D Model`}
              />
            </div>
          </div>

          <div className="animate-scale-in rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]" style={{ animationDelay: '0.1s' }}>
            <div className="p-3 border-b border-white/5 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="text-xs text-gray-500 ml-2">YouTube Video</span>
            </div>
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
              <iframe
                src={`https://www.youtube.com/embed/${civ.youtubeVideoId}?rel=0`}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                title={`${civ.name} Video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>

        <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex flex-wrap gap-2 mb-0 border-b border-white/10 pb-0">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium rounded-t-xl transition-all duration-300 cursor-pointer ${
                  activeTab === tab
                    ? 'bg-white/[0.07] text-amber-400 border border-white/10 border-b-transparent -mb-px'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
                }`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
          <div className="bg-white/[0.03] border border-white/10 border-t-0 rounded-b-2xl p-6 sm:p-8">
            <p className="text-gray-300 leading-relaxed text-base">{tabContent[activeTab]}</p>
          </div>
        </div>
      </div>

      <footer className="border-t border-white/5 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm">
          <p>Ancient Civilization Reconstructor &copy; 2026. Educational & Research Project.</p>
        </div>
      </footer>
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState<Page>('home')
  const [selectedCiv, setSelectedCiv] = useState<string | null>(null)

  const handleSelectCiv = (id: string) => {
    setSelectedCiv(id)
    setPage('detail')
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    setPage('home')
    setSelectedCiv(null)
  }

  return (
    <>
      <NavBar page={page} onNavigate={(p) => {
        if (p === 'home') handleBack()
        else if (p === 'restore') { setPage('restore'); window.scrollTo(0, 0) }
        else if (p === 'about') { setPage('about'); window.scrollTo(0, 0) }
      }} />
      {page === 'home' && <HomePage onSelectCiv={handleSelectCiv} />}
      {page === 'detail' && selectedCiv && <DetailPage civId={selectedCiv} onBack={handleBack} />}
      {page === 'restore' && <ArtifactRestorer />}
      {page === 'about' && <AboutPage />}
    </>
  )
}