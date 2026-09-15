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

function HomePage({ onSelectCiv, onNavigate }: { onSelectCiv: (id: string) => void; onNavigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <HeroSection onExplore={() => document.getElementById('civilizations')?.scrollIntoView({ behavior: 'smooth' })} />

      <section id="civilizations" className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
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

      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">How It Works</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Three Steps to the Past
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Choose', desc: 'Select from 8 ancient civilizations spanning continents and millennia — from the pyramids of Egypt to the forts of the UAE.', color: 'from-amber-500 to-orange-600' },
              { step: '02', title: 'Explore', desc: 'Interact with 3D photogrammetry models, watch historical videos, and read detailed tabs covering history, architecture, daily life, and achievements.', color: 'from-orange-500 to-red-600' },
              { step: '03', title: 'Reconstruct', desc: 'Use AI to restore broken artifacts — upload a photo of a damaged item and watch AI bring it back to its original glory.', color: 'from-teal-500 to-cyan-600' },
            ].map((item, i) => (
              <div key={item.step} className="animate-fade-in-up group" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="p-8 rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-500 h-full">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-white font-black text-lg">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">Explore the World</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Civilizations by Region
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">From the deserts of Jordan to the coasts of the UAE, our collection spans the globe.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { region: 'South Asia', civilizations: ['Taj Mahal'], icon: '🕌', color: 'bg-rose-500/10 border-rose-500/20' },
              { region: 'North Africa', civilizations: ['Ancient Egypt'], icon: '🏺', color: 'bg-amber-500/10 border-amber-500/20' },
              { region: 'Europe', civilizations: ['Ancient Rome'], icon: '⚔️', color: 'bg-sky-500/10 border-sky-500/20' },
              { region: 'Mesoamerica', civilizations: ['Maya Civilization'], icon: '🌿', color: 'bg-emerald-500/10 border-emerald-500/20' },
              { region: 'Middle East', civilizations: ['Petra'], icon: '🏜️', color: 'bg-orange-500/10 border-orange-500/20' },
              { region: 'UAE - East Coast', civilizations: ['Khor Fakkan Portuguese Fort'], icon: '🏰', color: 'bg-teal-500/10 border-teal-500/20' },
              { region: 'UAE - Ras Al Khaimah', civilizations: ['Al-Jazirat Al-Hamra', 'Dhayah Fort'], icon: '🏠', color: 'bg-violet-500/10 border-violet-500/20' },
            ].map((r, i) => (
              <div key={r.region} className={`animate-fade-in-up p-5 rounded-2xl border ${r.color} hover:scale-105 transition-transform duration-300`} style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="text-3xl mb-3">{r.icon}</div>
                <h3 className="text-white font-bold text-sm mb-2">{r.region}</h3>
                {r.civilizations.map(c => (
                  <p key={c} className="text-gray-400 text-xs">{c}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up">
              <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">3D Photogrammetry</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                See History in Three Dimensions
              </h2>
              <p className="text-gray-400 leading-relaxed mb-6">
                Our collection features real photogrammetry scans created by archaeologists and heritage organizations. These aren't artistic interpretations — they're precise digital twins of actual historical sites, captured using drones, laser scanning, and thousands of photographs.
              </p>
              <p className="text-gray-400 leading-relaxed mb-8">
                Rotate, zoom, and explore every angle. See the texture of carved stone, the wear of centuries, and the architectural details that photographs alone can't capture.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10">
                  <span className="text-2xl font-black text-amber-400">187K+</span>
                  <span className="text-gray-500 text-xs ml-2">triangles per model</span>
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10">
                  <span className="text-2xl font-black text-amber-400">4K</span>
                  <span className="text-gray-500 text-xs ml-2">texture resolution</span>
                </div>
              </div>
            </div>
            <div className="animate-fade-in-up rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] p-2" style={{ animationDelay: '0.2s' }}>
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  src="https://sketchfab.com/models/d02e8cdef15946408be6613fc5d1f0ff/embed?autostart=0"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  title="Taj Mahal 3D Model"
                />
              </div>
              <p className="text-center text-gray-500 text-xs mt-3">Taj Mahal — Interactive 3D photogrammetry scan</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">AI-Powered</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Artifact Restoration
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">Upload a broken artifact and watch AI restore it to its original condition.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="animate-fade-in-up p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Auto Restore</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Simply upload a photo of any damaged artifact — cracked pottery, broken sculptures, eroded inscriptions — and our AI will generate a restored version in seconds.
              </p>
            </div>
            <div className="animate-fade-in-up p-8 rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02]" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-white">Manual Mask</h3>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                For precise control, paint over the damaged areas yourself. The AI will only restore the parts you mark, preserving the rest of the artifact exactly as it is.
              </p>
            </div>
          </div>
          <div className="text-center mt-10">
            <button
              onClick={() => onNavigate('restore')}
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold rounded-xl text-lg hover:from-amber-400 hover:to-orange-500 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25 cursor-pointer"
            >
              Try AI Restorer
            </button>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">Why It Matters</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Preserving Heritage for Future Generations
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { stat: '5,000+', label: 'Years of History', desc: 'Spanning from Bronze Age forts to 17th-century mosques' },
              { stat: '8', label: 'Civilizations', desc: 'Covering 4 continents and diverse cultures' },
              { stat: '100%', label: 'Free Access', desc: 'Open to students, researchers, and curious minds worldwide' },
            ].map((item, i) => (
              <div key={item.label} className="animate-fade-in-up text-center p-8 rounded-2xl border border-white/10 bg-white/[0.03]" style={{ animationDelay: `${i * 0.15}s` }}>
                <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">{item.stat}</p>
                <p className="text-white font-bold mb-2">{item.label}</p>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="animate-fade-in-up">
            <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">About the Creators</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
              Built with Passion for History
            </h2>
          </div>
          <div className="animate-fade-in-up space-y-6" style={{ animationDelay: '0.15s' }}>
            <p className="text-gray-400 leading-relaxed">
              The Ancient Civilization Reconstructor was created as an educational project to make cultural heritage accessible to everyone. By combining modern web technologies with 3D scanning, AI, and historical research, we aim to bring the past to life in ways that textbooks cannot.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Our team believes that understanding ancient civilizations — their architecture, daily lives, and achievements — helps us appreciate the diversity and ingenuity of human culture across time and geography.
            </p>
          </div>
          <div className="animate-fade-in-up mt-10 p-8 rounded-2xl border border-white/10 bg-white/[0.03]" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <p className="text-white font-bold text-lg mb-1">The Project Team</p>
            <p className="text-gray-500 text-sm mb-4">Developers, Researchers & History Enthusiasts</p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-lg mx-auto">
              This project is a labor of love — combining skills in web development, data science, and historical research to create an interactive learning platform. Every civilization page is carefully researched using academic sources, museum archives, and on-the-ground heritage documentation.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <a href="https://github.com/leenelzoubii/Ancient-Civilization-Reconstructor" target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                View on GitHub
              </a>
            </div>
          </div>
          <p className="text-gray-600 text-xs mt-8">
            This is an educational and research project. All content is used for non-commercial purposes. 3D models are property of their respective creators on Sketchfab.
          </p>
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
      {page === 'home' && <HomePage onSelectCiv={handleSelectCiv} onNavigate={(p) => { setPage(p); window.scrollTo(0, 0) }} />}
      {page === 'detail' && selectedCiv && <DetailPage civId={selectedCiv} onBack={handleBack} />}
      {page === 'restore' && <ArtifactRestorer />}
      {page === 'about' && <AboutPage />}
    </>
  )
}