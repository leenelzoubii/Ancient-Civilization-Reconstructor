import CivilizationGrid from '@/components/CivilizationGrid';
import SSECivilizationsStream from '@/components/SSECivilizationsStream';
import { Suspense } from 'react';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <h1 className="text-5xl font-bold text-primary-gold mb-4">
              Ancient Civilization
            </h1>
            <h2 className="text-3xl font-medium text-primary-dark">
              Reconstructor
            </h2>
            <p className="text-lg text-primary-gold max-w-2xl mx-auto">
              Explore reconstructed environments and discover the wonders of the past
            </p>
          </header>

          <CivilizationGrid />
          
          <SSECivilizationsStream />
        </div>
      </Suspense>
    </main>
  );
}