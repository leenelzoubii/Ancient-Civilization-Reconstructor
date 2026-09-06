"use client";

import civilizations from "@/data/civilizations.json";

export default function CivilizationGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-4 py-8">
      {civilizations.civilizations.map((civ, index) => (
        <div
          key={civ.id}
          className="group rounded-2xl overflow-hidden border-border hover:shadow-2xl transition-shadow duration-300 border"
          style={{ animationDelay: `${index * 0.1}s`, animation: 'fadeInUp 0.6s ease-out forwards' }}
        >
          <img
            src={`/images/${civ.id}-thumbnail.jpg`}
            alt={civ.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="p-4 flex flex-col flex-col-gap-2">
            <h3 className="text-xl font-bold text-primary-dark line-clamp-1">{civ.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{civ.overview}</p>
            <a
              href={`/civilization/${civ.id}`}
              className="mt-auto inline-block text-primary-gold font-medium transition-colors capitalize"
            >
              View Details
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}