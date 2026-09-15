export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] pt-20 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 animate-fade-in-up">
          <p className="text-amber-400 text-sm font-medium tracking-widest uppercase mb-3">About</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
            Ancient Civilization Reconstructor
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            An educational platform exploring the wonders of ancient civilizations through 3D models, historical content, and AI-powered tools.
          </p>
        </div>

        <div className="space-y-8">
          <section className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Our Mission</h2>
            <p className="text-gray-400 leading-relaxed">
              The Ancient Civilization Reconstructor is an educational and research project dedicated to bringing the past to life. We combine historical research, 3D photogrammetry models, and AI technology to help students, historians, and curious minds explore and reconstruct ancient artifacts and sites from around the world.
            </p>
          </section>

          <section className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8" style={{ animationDelay: '0.15s' }}>
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Civilizations Covered</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Taj Mahal', desc: 'Mughal architecture in Agra, India' },
                { name: 'Ancient Egypt', desc: 'Pyramids, pharaohs, and the Nile' },
                { name: 'Ancient Rome', desc: 'Engineering marvels and empire' },
                { name: 'Maya Civilization', desc: 'Calendar, mathematics, and temples' },
                { name: 'Khor Fakkan Portuguese Fort', desc: '16th-century coastal fortress, UAE' },
                { name: 'Petra', desc: 'Rock-cut Nabatean city, Jordan' },
                { name: 'Al-Jazirat Al-Hamra', desc: 'Historic pearl diving village, UAE' },
                { name: 'Dhayah Fort', desc: 'Hilltop fort in Ras Al Khaimah, UAE' },
              ].map(civ => (
                <div key={civ.name} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium text-sm">{civ.name}</p>
                    <p className="text-gray-500 text-xs">{civ.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8" style={{ animationDelay: '0.2s' }}>
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: '🏛️', title: '3D Models', desc: 'Interactive Sketchfab photogrammetry scans of real archaeological sites' },
                { icon: '🎥', title: 'Video Content', desc: 'Curated YouTube videos documenting each civilization' },
                { icon: '🤖', title: 'AI Restorer', desc: 'Upload a broken artifact photo and AI generates a restored version' },
              ].map(f => (
                <div key={f.title} className="text-center p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <p className="text-white font-semibold text-sm mb-1">{f.title}</p>
                  <p className="text-gray-500 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8" style={{ animationDelay: '0.25s' }}>
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Technology</h2>
            <div className="space-y-3 text-gray-400 text-sm leading-relaxed">
              <p>
                This project is built with <span className="text-white font-medium">React</span>, <span className="text-white font-medium">Vite</span>, and <span className="text-white font-medium">Tailwind CSS</span>. It features interactive 3D model embeds from Sketchfab, curated YouTube video content, and an AI-powered artifact restoration tool using the Hugging Face Inference API with Stable Diffusion inpainting.
              </p>
              <p>
                The 3D models are photogrammetry scans created by researchers and heritage organizations including Global Digital Heritage, the American University of Sharjah, and independent creators. These models provide accurate, high-resolution digital preservation of irreplaceable cultural heritage sites.
              </p>
            </div>
          </section>

          <section className="animate-fade-in-up rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8" style={{ animationDelay: '0.3s' }}>
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Credits & Sources</h2>
            <div className="space-y-2 text-gray-400 text-sm">
              <p><span className="text-white font-medium">3D Models:</span> Sketchfab creators — Global Digital Heritage, Zlatan.Filipovic, HeritageTech, and community contributors</p>
              <p><span className="text-white font-medium">Video Content:</span> YouTube educational creators and documentary channels</p>
              <p><span className="text-white font-medium">AI Restoration:</span> Hugging Face Inference API — stabilityai/stable-diffusion-2-inpainting</p>
              <p><span className="text-white font-medium">Historical Research:</span> UNESCO, national heritage departments, and academic publications</p>
            </div>
          </section>

          <section className="animate-fade-in-up text-center py-8" style={{ animationDelay: '0.35s' }}>
            <p className="text-gray-600 text-sm">
              This is an educational and research project. All content is used for non-commercial purposes.
            </p>
          </section>
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