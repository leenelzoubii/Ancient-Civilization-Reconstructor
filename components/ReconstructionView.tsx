import civilizations from '@/data/civilizations.json';

interface TabBtnProps {
  tab: string;
  active: boolean;
  onClick: () => void;
}

interface TabContentProps {
  tab: string;
  content: string;
}

export default function ReconstructionView({
  params,
}: { params: { civId: string } }) {
  const civ = civilizations.civilizations.find(
    (c) => c.id === params.civId
  );

  if (!civ) {
    return <p>Civilization not found</p>;
  }

  const [activeTab, setActiveTab] = React.useState<'overview' | 'history' | 'architecture' | 'daily-life' | 'achievements'>('overview');

  const tabContentMap: Record<string, string> = {
    overview: civ.overview,
    history: civ.history,
    architecture: civ.architecture,
    'daily-life': civ.dailyLife,
    achievements: civ.achievements,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <h1 className="text-2xl font-bold text-primary-dark">
              {civ.name}
            </h1>
            <button
              onClick={() => window.history.back()}
              className="text-gray-500 hover:text-primary-gold transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </nav>

      <main className="px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Video Section */}
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${civ.youtubeVideoId}?autoplay=1&modestbranding=1&showinfo=0`}
              title={`${civ.name} video`}
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* 3D Viewer Section */}
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg">
            <iframe
              width="100%"
              height="400"
              src={`https://sketchfab.com/models/${civ.sketchfabScene}/embed`}
              allow="fullscreen; fullscreen *; xr-spatial;"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Tab Navigation */}
          <div className="mb-6 flex gap-2 rounded-full bg-white shadow-sm">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-t transition-colors ${
                activeTab === 'overview' ? 'bg-primary-gold text-primary-dark' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-t ${
                activeTab === 'history' ? 'bg-primary-gold text-primary-dark' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('architecture')}
              className={`px-4 py-2 rounded-t ${
                activeTab === 'architecture' ? 'bg-primary-gold text-primary-dark' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Architecture
            </button>
            <button
              onClick={() => setActiveTab('daily-life')}
              className={`px-4 py-2 rounded-t ${
                activeTab === 'daily-life' ? 'bg-primary-gold text-primary-dark' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Daily Life
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-4 py-2 rounded-t ${
                activeTab === 'achievements' ? 'bg-primary-gold text-primary-dark' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Achievements
            </button>
          </div>

          {/* Tab Content */}
          <div
            className="bg-white rounded-b p-6 shadow-sm min-h-[300px]"
          >
            <p className="text-gray-700 leading-relaxed">{tabContentMap[activeTab]}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps(context: any) {
  const { civId } = context.params;
  const civ = (await import('@/data/civilizations.json')).default.civilizations.find(
    (c: any) => c.id === civId
  );

  if (!civ) {
    return { notFound: true };
  }

  return { props: { params: { civId } }, revalidate: 60 };
}